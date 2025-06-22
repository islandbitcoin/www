import { useState, useCallback, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { gameWalletManager, GameWalletConfig, UserBalance } from '@/lib/gameWallet';
import { getNWCClient } from '@/lib/nwc';

export function useGameWallet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [config, setConfig] = useState<GameWalletConfig>(gameWalletManager.getConfig());
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  
  // Refresh config and sync from server periodically
  useEffect(() => {
    let mounted = true;
    
    const refreshConfig = async () => {
      // Try to load from sync server first
      const loaded = await gameWalletManager.loadConfigFromServer();
      
      // Only update state if component is still mounted
      if (!mounted) return;
      
      if (loaded) {
        // Server had updates, get the updated config
        const latestConfig = gameWalletManager.getConfig();
        setConfig(latestConfig);
      } else {
        // No updates from server, use local config
        const latestConfig = gameWalletManager.getConfig();
        setConfig(latestConfig);
      }
    };
    
    // Initial load
    refreshConfig();
    
    // Check every 5 seconds for server updates
    const interval = setInterval(refreshConfig, 5000);
    
    // Also listen for storage events (works within same browser)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'island-bitcoin-secure' && mounted) {
        refreshConfig();
      }
    };
    
    // Listen for custom config update events
    const handleConfigUpdate = () => {
      if (mounted) {
        const latestConfig = gameWalletManager.getConfig();
        setConfig(latestConfig);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gameWalletConfigUpdate', handleConfigUpdate);
    
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gameWalletConfigUpdate', handleConfigUpdate);
    };
  }, []);

  // Load user balance when user changes or refresh key changes
  useEffect(() => {
    if (user) {
      setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    } else {
      setUserBalance(null);
    }
  }, [user, balanceRefreshKey]);
  
  // Function to force refresh balance
  const refreshBalance = useCallback(() => {
    setBalanceRefreshKey(prev => prev + 1);
  }, []);

  // Check if user is admin
  const isAdmin = user ? gameWalletManager.isAdmin(user.pubkey) : false;

  // Connect wallet (admin only)
  const connectWallet = useCallback(async (nwcUri: string) => {
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can connect the game wallet',
        variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const nwcClient = getNWCClient(nostr);
      console.log('Connecting to NWC wallet with URI:', nwcUri.substring(0, 50) + '...');
      
      const info = await nwcClient.connect(nwcUri);
      console.log('Connected successfully, wallet info:', info);
      
      // Save connection first
      gameWalletManager.saveConfig({
        nwcUri,
        isConnected: true
      });
      
      // Try to check balance, but don't fail if it errors
      try {
        const balance = await nwcClient.getBalance();
        console.log('Wallet balance:', balance);
        
        gameWalletManager.saveConfig({
          walletBalance: balance.balance,
          lastBalanceCheck: new Date().toISOString()
        });
        
        setWalletBalance(balance.balance);
      } catch (balanceError) {
        console.warn('Could not fetch wallet balance:', balanceError);
        // Continue anyway - balance check is not critical for connection
      }
      
      setConfig(gameWalletManager.getConfig());
      
      toast({
        title: 'Wallet connected!',
        description: `Connected to wallet successfully` });
    } catch (error) {
      console.error('NWC connection error:', error);
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, nostr, toast]);

  // Disconnect wallet (admin only)
  const disconnectWallet = useCallback(() => {
    if (!isAdmin) return;
    
    const nwcClient = getNWCClient(nostr);
    nwcClient.disconnect();
    
    gameWalletManager.saveConfig({
      nwcUri: undefined,
      isConnected: false,
      walletBalance: undefined,
      lastBalanceCheck: undefined });
    
    setConfig(gameWalletManager.getConfig());
    setWalletBalance(null);
    
    toast({
      title: 'Wallet disconnected',
      description: 'Game wallet has been disconnected' });
  }, [isAdmin, nostr, toast]);

  // Check wallet balance
  const checkWalletBalance = useCallback(async () => {
    if (!config.isConnected) return;
    
    setIsLoading(true);
    try {
      const nwcClient = getNWCClient(nostr);
      if (config.nwcUri) {
        await nwcClient.connect(config.nwcUri);
      }
      
      const balance = await nwcClient.getBalance();
      setWalletBalance(balance.balance);
      
      gameWalletManager.saveConfig({
        walletBalance: balance.balance,
        lastBalanceCheck: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to check balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config, nostr]);

  // Award sats to user
  const awardSats = useCallback(async (
    amount: number,
    gameType: 'trivia' | 'stacker' | 'achievement' | 'referral',
    _gameData?: Record<string, unknown>
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please sign in to earn sats',
        variant: 'destructive' });
      return false;
    }

    // Check if user can earn more
    const canEarn = gameWalletManager.canUserEarnMore(user.pubkey);
    if (!canEarn.allowed) {
      toast({
        title: 'Limit reached',
        description: canEarn.reason,
        variant: 'destructive' });
      return false;
    }

    // Record the payout (without gameData - data minimization)
    const payout = gameWalletManager.recordPayout({
      userPubkey: user.pubkey,
      amount,
      gameType });

    // Update user balance directly to actual balance (not pending)
    // Since this is just internal tracking, we don't need pending state
    const balance = gameWalletManager.getUserBalance(user.pubkey);
    
    gameWalletManager.updateUserBalance(user.pubkey, {
      balance: balance.balance + amount,
      totalEarned: balance.totalEarned + amount });
    
    setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    
    // Mark payout as paid since it's an internal balance update
    gameWalletManager.updatePayoutStatus(payout.id, 'paid');
    
    toast({
      title: `+${amount} sats!`,
      description: 'Reward added to your balance' });
    
    // Trigger balance refresh for all components
    refreshBalance();
    
    return true;
  }, [user, toast, refreshBalance]);

  // Withdraw sats to Lightning address or via LNURL/WebLN
  const withdrawSats = useCallback(async (destination: string): Promise<boolean> => {
    if (!user) return false;
    
    const balance = gameWalletManager.getUserBalance(user.pubkey);
    const amount = balance.balance; // Withdraw full balance
    
    if (amount < config.minWithdrawal) {
      toast({
        title: 'Insufficient balance',
        description: `Minimum withdrawal is ${config.minWithdrawal} sats`,
        variant: 'destructive' });
      return false;
    }
    
    // Handle different withdrawal types
    const withdrawalType = destination.startsWith('pullpayment:') ? 'pullpayment' : 'unknown';
    const pullPaymentId = withdrawalType === 'pullpayment' ? destination.replace('pullpayment:', '') : undefined;
    
    // Create a payout record
    const payout = gameWalletManager.recordPayout({
      userPubkey: user.pubkey,
      amount,
      gameType: 'withdrawal' as const,
      pullPaymentId
    });
    
    // Update balance immediately (optimistic update)
    gameWalletManager.updateUserBalance(user.pubkey, {
      balance: 0,
      totalWithdrawn: balance.totalWithdrawn + amount,
      lastWithdrawal: new Date().toISOString() });
    
    setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    
    // Handle pull payment withdrawals (instant, no admin wallet needed)
    if (withdrawalType === 'pullpayment') {
      toast({
        title: '✅ Withdrawal QR code generated!',
        description: 'Scan the QR code with your Lightning wallet to complete the withdrawal.' });
      
      // Mark as paid since pull payment handles it
      gameWalletManager.updatePayoutStatus(payout.id, 'paid', pullPaymentId);
      
      // Trigger balance refresh for all components
      refreshBalance();
      
      return true;
    }
    
    // Unknown withdrawal type
    toast({
      title: 'Unsupported withdrawal type',
      description: 'Please use the QR code withdrawal method.',
      variant: 'destructive' });
    
    // Revert balance
    gameWalletManager.updateUserBalance(user.pubkey, {
      balance: amount,
      totalWithdrawn: balance.totalWithdrawn,
      lastWithdrawal: balance.lastWithdrawal });
    
    setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    
    return false;
  }, [user, config, nostr, toast, refreshBalance]);

  // Update config (admin only)
  const updateConfig = useCallback(async (updates: Partial<GameWalletConfig>) => {
    if (!isAdmin) return;
    
    await gameWalletManager.saveConfig(updates);
    setConfig(gameWalletManager.getConfig());
  }, [isAdmin]);

  // Get payouts (admin only)
  const getPayouts = useCallback((filters?: Parameters<typeof gameWalletManager.getPayouts>[0]) => {
    if (!isAdmin) return [];
    return gameWalletManager.getPayouts(filters);
  }, [isAdmin]);

  // Note: Withdrawals are now handled through pull payments, not NWC
  const processPendingWithdrawals = useCallback(async () => {
    toast({
      title: 'Pull payments in use',
      description: 'Withdrawals are handled instantly via pull payments' });
  }, [toast]);

  // Reset a failed withdrawal and restore balance (admin only)
  const resetWithdrawal = useCallback((payoutId: string) => {
    if (!isAdmin) return false;
    
    const success = gameWalletManager.resetWithdrawal(payoutId);
    if (success) {
      toast({
        title: 'Withdrawal reset',
        description: 'Sats have been restored to user balance' });
      refreshBalance();
    } else {
      toast({
        title: 'Reset failed',
        description: 'Could not reset this withdrawal',
        variant: 'destructive' });
    }
    return success;
  }, [isAdmin, toast, refreshBalance]);

  // Get resetable withdrawals (admin only)
  const getResetableWithdrawals = useCallback(() => {
    if (!isAdmin) return [];
    return gameWalletManager.getResetableWithdrawals();
  }, [isAdmin]);

  return {
    // State
    config,
    userBalance,
    walletBalance,
    isLoading,
    isAdmin,
    
    // Actions
    connectWallet,
    disconnectWallet,
    checkWalletBalance,
    awardSats,
    withdrawSats,
    updateConfig,
    getPayouts,
    refreshBalance,
    processPendingWithdrawals,
    resetWithdrawal,
    getResetableWithdrawals,
    
    // Helpers
    canUserEarnMore: user ? gameWalletManager.canUserEarnMore(user.pubkey) : { allowed: false },
    userDailyTotal: user ? gameWalletManager.getUserDailyTotal(user.pubkey) : 0,
    totalDailyPayout: gameWalletManager.getTotalDailyPayout() };
}