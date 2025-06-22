import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { referralSystem, UserReferralStats } from '@/lib/referralSystem';
import { useSearchParams } from 'react-router-dom';
import { gameWalletManager } from '@/lib/gameWallet';

export function useReferral() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [isProcessingReferral, setIsProcessingReferral] = useState(false);

  // Load user stats
  useEffect(() => {
    if (user) {
      const userStats = referralSystem.getUserStats(user.pubkey);
      setStats(userStats);
      setReferralLink(referralSystem.getReferralLink(user.pubkey));
    }
  }, [user]);

  // Check for referral code in URL on first login
  useEffect(() => {
    if (!user) return;

    const refCode = searchParams.get('ref');
    if (!refCode) return;

    // Check if this is a new user (no referral history)
    const userStats = referralSystem.getUserStats(user.pubkey);
    if (userStats.referredBy) return; // Already referred

    setIsProcessingReferral(true);

    // Process the referral
    const success = referralSystem.trackReferral(refCode, user.pubkey);
    
    if (success) {
      const config = gameWalletManager.getConfig();
      const signupBonus = Math.floor((config.gameRewards?.referralBonus || 100) * 0.25);
      toast({
        title: 'Welcome bonus!',
        description: `You earned ${signupBonus} sats for using a referral link!`
      });
    }

    setIsProcessingReferral(false);

    // Remove ref param from URL
    searchParams.delete('ref');
    window.history.replaceState({}, '', `${window.location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }, [user, searchParams, toast]);

  // Copy referral link
  const copyReferralLink = useCallback(() => {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink);
    
    if (user) {
      referralSystem.trackReferralShare(user.pubkey);
    }

    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard'
    });
  }, [referralLink, user, toast]);

  // Share referral link
  const shareReferralLink = useCallback(async () => {
    if (!referralLink || !navigator.share) {
      copyReferralLink();
      return;
    }

    try {
      await navigator.share({
        title: 'Join Island Bitcoin',
        text: 'Learn about Bitcoin and earn sats!',
        url: referralLink
      });
      
      if (user) {
        referralSystem.trackReferralShare(user.pubkey);
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        copyReferralLink();
      }
    }
  }, [referralLink, user, copyReferralLink]);

  // Get referral leaderboard
  const getReferralLeaderboard = useCallback(() => {
    return referralSystem.getReferralLeaderboard();
  }, []);

  // Check if user has completed first game (for referral rewards)
  const checkReferralCompletion = useCallback(() => {
    if (user && stats?.referredBy) {
      referralSystem.checkReferralCompletion(user.pubkey);
    }
  }, [user, stats]);

  return {
    stats,
    referralLink,
    isProcessingReferral,
    copyReferralLink,
    shareReferralLink,
    getReferralLeaderboard,
    checkReferralCompletion
  };
}