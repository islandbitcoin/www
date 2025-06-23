import { useState, useCallback, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { gameWalletManager, GameWalletConfig, UserBalance } from '@/lib/gameWallet';

export function useGameWallet() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [config, setConfig] = useState<GameWalletConfig>(gameWalletManager.getConfig());
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading] = useState(false);
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
    
    // Check every 10 seconds for server updates
    const interval = setInterval(refreshConfig, 10000);
    
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
  }, [user, config, toast, refreshBalance]);

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
    isLoading,
    isAdmin,
    
    // Actions
    awardSats,
    withdrawSats,
    updateConfig,
    getPayouts,
    refreshBalance,
    resetWithdrawal,
    getResetableWithdrawals,
    
    // Helpers
    canUserEarnMore: user ? gameWalletManager.canUserEarnMore(user.pubkey) : { allowed: false },
    userDailyTotal: user ? gameWalletManager.getUserDailyTotal(user.pubkey) : 0,
    totalDailyPayout: gameWalletManager.getTotalDailyPayout() };
}