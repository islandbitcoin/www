import { useState, useCallback, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useGameWallet } from './useGameWallet';
import { useToast } from './useToast';
import { anonymousUserManager, AnonymousUser } from '@/lib/anonymousUser';
import { gameWalletManager } from '@/lib/gameWallet';
import { genUserName } from '@/lib/genUserName';

interface AnonymousGameSession {
  user: AnonymousUser | null;
  isAnonymous: boolean;
  balance: number;
  canWithdraw: boolean;
  awardSats: (amount: number, gameType: string) => Promise<boolean>;
  getDisplayName: () => string;
}

/**
 * Hook that enables anonymous gameplay without Nostr login
 * Anonymous users can play games and see their balance but cannot withdraw
 */
export function useAnonymousPlay(): AnonymousGameSession {
  const { user: nostrUser, metadata } = useCurrentUser();
  const { awardSats: nostrAwardSats } = useGameWallet();
  const { toast } = useToast();
  const [anonymousUser, setAnonymousUser] = useState<AnonymousUser | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // If no Nostr user is logged in, create/load anonymous user
    if (!nostrUser) {
      const anonUser = anonymousUserManager.getOrCreateUser();
      setAnonymousUser(anonUser);
      
      // Load balance from local storage for anonymous user
      const userBalance = gameWalletManager.getUserBalance(anonUser.id);
      setBalance(userBalance.balance);
    } else {
      // Clear anonymous user when Nostr user logs in
      setAnonymousUser(null);
      setBalance(0);
    }
  }, [nostrUser]);

  // Award sats for anonymous users (stored locally only)
  const awardSatsAnonymous = useCallback((amount: number, gameType: string): boolean => {
    if (!anonymousUser) return false;

    // Update anonymous user stats
    anonymousUserManager.updateStats(amount);

    // Update balance in game wallet (local only)
    const currentBalance = gameWalletManager.getUserBalance(anonymousUser.id);
    gameWalletManager.updateUserBalance(anonymousUser.id, {
      balance: currentBalance.balance + amount,
      totalEarned: currentBalance.totalEarned + amount
    });

    // Record payout for tracking
    gameWalletManager.recordPayout({
      userPubkey: anonymousUser.id,
      amount,
      gameType: gameType as "trivia" | "stacker" | "achievement" | "referral"
    });

    setBalance(currentBalance.balance + amount);

    toast({
      title: `+${amount} sats!`,
      description: 'Added to your guest balance (login to withdraw)'
    });

    return true;
  }, [anonymousUser, toast]);

  // Unified award function that works for both logged-in and anonymous users
  const awardSats = useCallback(async (amount: number, gameType: string): Promise<boolean> => {
    if (nostrUser) {
      // Use regular award system for logged-in users
      return nostrAwardSats(amount, gameType as "trivia" | "stacker" | "achievement" | "referral");
    } else {
      // Use anonymous award system
      return awardSatsAnonymous(amount, gameType);
    }
  }, [nostrUser, nostrAwardSats, awardSatsAnonymous]);

  // Get display name for current user (logged-in or anonymous)
  const getDisplayName = useCallback((): string => {
    if (nostrUser) {
      return metadata?.name || genUserName(nostrUser.pubkey);
    } else if (anonymousUser) {
      return anonymousUserManager.getDisplayName(anonymousUser.id);
    }
    return 'Guest';
  }, [nostrUser, anonymousUser, metadata]);

  // Get current balance
  useEffect(() => {
    if (nostrUser) {
      const userBalance = gameWalletManager.getUserBalance(nostrUser.pubkey);
      setBalance(userBalance.balance);
    } else if (anonymousUser) {
      const userBalance = gameWalletManager.getUserBalance(anonymousUser.id);
      setBalance(userBalance.balance);
    }

    // Listen for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
      const { pubkey, balance: updatedBalance } = event.detail;
      if (nostrUser && pubkey === nostrUser.pubkey) {
        setBalance(updatedBalance.balance);
      } else if (anonymousUser && pubkey === anonymousUser.id) {
        setBalance(updatedBalance.balance);
      }
    };

    window.addEventListener('gameWalletBalanceUpdate', handleBalanceUpdate as EventListener);
    return () => {
      window.removeEventListener('gameWalletBalanceUpdate', handleBalanceUpdate as EventListener);
    };
  }, [nostrUser, anonymousUser]);

  return {
    user: anonymousUser,
    isAnonymous: !nostrUser && !!anonymousUser,
    balance,
    canWithdraw: !!nostrUser, // Only logged-in users can withdraw
    awardSats,
    getDisplayName
  };
}