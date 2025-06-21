import { useState, useCallback, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { gameWalletManager, GameWalletConfig, UserBalance } from '@/lib/gameWallet';
import { getNWCClient } from '@/lib/nwc';
import { nip19 } from 'nostr-tools';

export function useGameWallet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [config, setConfig] = useState<GameWalletConfig>(gameWalletManager.getConfig());
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Load user balance when user changes
  useEffect(() => {
    if (user) {
      setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    } else {
      setUserBalance(null);
    }
  }, [user]);

  // Check if user is admin
  const isAdmin = user ? gameWalletManager.isAdmin(user.pubkey) : false;

  // Connect wallet (admin only)
  const connectWallet = useCallback(async (nwcUri: string) => {
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can connect the game wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const nwcClient = getNWCClient(nostr);
      const info = await nwcClient.connect(nwcUri);
      
      // Check balance
      const balance = await nwcClient.getBalance();
      
      gameWalletManager.saveConfig({
        nwcUri,
        isConnected: true,
        walletBalance: balance.balance,
        lastBalanceCheck: new Date().toISOString(),
      });
      
      setConfig(gameWalletManager.getConfig());
      setWalletBalance(balance.balance);
      
      toast({
        title: 'Wallet connected!',
        description: `Connected to wallet with ${info.methods.length} available methods`,
      });
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive',
      });
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
      lastBalanceCheck: undefined,
    });
    
    setConfig(gameWalletManager.getConfig());
    setWalletBalance(null);
    
    toast({
      title: 'Wallet disconnected',
      description: 'Game wallet has been disconnected',
    });
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
        lastBalanceCheck: new Date().toISOString(),
      });
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
    gameData?: any
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please sign in to earn sats',
        variant: 'destructive',
      });
      return false;
    }

    // Check if user can earn more
    const canEarn = gameWalletManager.canUserEarnMore(user.pubkey);
    if (!canEarn.allowed) {
      toast({
        title: 'Limit reached',
        description: canEarn.reason,
        variant: 'destructive',
      });
      return false;
    }

    // Record the payout
    const payout = gameWalletManager.recordPayout({
      userPubkey: user.pubkey,
      amount,
      gameType,
      gameData,
    });

    // Update user balance (add to pending)
    const balance = gameWalletManager.getUserBalance(user.pubkey);
    gameWalletManager.updateUserBalance(user.pubkey, {
      pendingBalance: balance.pendingBalance + amount,
      totalEarned: balance.totalEarned + amount,
    });
    
    setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
    
    // Process payout if wallet is connected
    if (config.isConnected && config.nwcUri) {
      try {
        // For now, just mark as paid - real implementation would create invoice
        gameWalletManager.updatePayoutStatus(payout.id, 'paid', {
          paymentProof: 'simulated_' + Date.now(),
        });
        
        // Move from pending to actual balance
        const updatedBalance = gameWalletManager.getUserBalance(user.pubkey);
        gameWalletManager.updateUserBalance(user.pubkey, {
          balance: updatedBalance.balance + amount,
          pendingBalance: Math.max(0, updatedBalance.pendingBalance - amount),
        });
        
        setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
        
        toast({
          title: `+${amount} sats!`,
          description: 'Reward added to your balance',
        });
        
        return true;
      } catch (error) {
        gameWalletManager.updatePayoutStatus(payout.id, 'failed', {
          error: error instanceof Error ? error.message : 'Payment failed',
        });
        
        toast({
          title: 'Payment failed',
          description: 'Your reward is pending and will be retried',
          variant: 'destructive',
        });
        
        return false;
      }
    } else {
      // Wallet not connected - rewards stay pending
      toast({
        title: `+${amount} sats pending`,
        description: 'Rewards will be paid when wallet is connected',
      });
      return true;
    }
  }, [user, config, toast]);

  // Withdraw sats
  const withdrawSats = useCallback(async (invoice: string): Promise<boolean> => {
    if (!user) return false;
    
    const balance = gameWalletManager.getUserBalance(user.pubkey);
    
    // Parse invoice to get amount
    // For now, we'll simulate - real implementation would decode the invoice
    const amount = balance.balance; // Withdraw full balance
    
    if (amount < config.minWithdrawal) {
      toast({
        title: 'Insufficient balance',
        description: `Minimum withdrawal is ${config.minWithdrawal} sats`,
        variant: 'destructive',
      });
      return false;
    }
    
    if (!config.isConnected || !config.nwcUri) {
      toast({
        title: 'Wallet not connected',
        description: 'Game wallet is offline. Please contact admin.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      const nwcClient = getNWCClient(nostr);
      await nwcClient.connect(config.nwcUri);
      
      // Pay the invoice
      const payment = await nwcClient.payInvoice(invoice);
      
      // Update balance
      gameWalletManager.updateUserBalance(user.pubkey, {
        balance: 0,
        totalWithdrawn: balance.totalWithdrawn + amount,
        lastWithdrawal: new Date().toISOString(),
      });
      
      setUserBalance(gameWalletManager.getUserBalance(user.pubkey));
      
      toast({
        title: 'Withdrawal successful!',
        description: `${amount} sats sent to your wallet`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Withdrawal failed',
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, config, nostr, toast]);

  // Update config (admin only)
  const updateConfig = useCallback((updates: Partial<GameWalletConfig>) => {
    if (!isAdmin) return;
    
    gameWalletManager.saveConfig(updates);
    setConfig(gameWalletManager.getConfig());
    
    toast({
      title: 'Settings updated',
      description: 'Game wallet configuration has been saved',
    });
  }, [isAdmin, toast]);

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
    
    // Helpers
    canUserEarnMore: user ? gameWalletManager.canUserEarnMore(user.pubkey) : { allowed: false },
    userDailyTotal: user ? gameWalletManager.getUserDailyTotal(user.pubkey) : 0,
    totalDailyPayout: gameWalletManager.getTotalDailyPayout(),
  };
}