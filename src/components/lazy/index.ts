/**
 * Lazy-loaded components for code splitting
 * Components are loaded only when needed to improve initial bundle size
 */

import { lazy } from 'react';

// Game components - loaded when user accesses games section
export const BitcoinGames = lazy(() => 
  import('@/components/games/BitcoinGames').then(module => ({
    default: module.BitcoinGames
  }))
);

export const BitcoinTrivia = lazy(() => 
  import('@/components/games/BitcoinTrivia').then(module => ({
    default: module.BitcoinTrivia
  }))
);

export const SatoshiStacker = lazy(() => 
  import('@/components/games/SatoshiStacker').then(module => ({
    default: module.SatoshiStacker
  }))
);

export const Leaderboard = lazy(() => 
  import('@/components/games/Leaderboard').then(module => ({
    default: module.Leaderboard
  }))
);

export const ReferralLeaderboard = lazy(() => 
  import('@/components/games/ReferralLeaderboard').then(module => ({
    default: module.ReferralLeaderboard
  }))
);

// Admin components - loaded when admin accesses admin features
export const SetupWizard = lazy(() => 
  import('@/components/admin/SetupWizard').then(module => ({
    default: module.SetupWizard
  }))
);

export const SetupCheck = lazy(() => 
  import('@/components/admin/SetupCheck').then(module => ({
    default: module.SetupCheck
  }))
);

// Social components - loaded when user interacts with social features
export const NostrFeed = lazy(() => 
  import('@/components/social/NostrFeed').then(module => ({
    default: module.NostrFeed
  }))
);

export const DirectMessageDialog = lazy(() => 
  import('@/components/social/DirectMessageDialog').then(module => ({
    default: module.DirectMessageDialog
  }))
);

// Financial components - loaded when user accesses financial features
export const WithdrawDialog = lazy(() => 
  import('@/components/financial/WithdrawDialog').then(module => ({
    default: module.WithdrawDialog
  }))
);

export const ReferralPanel = lazy(() => 
  import('@/components/financial/ReferralPanel').then(module => ({
    default: module.ReferralPanel
  }))
);

// Common components that are less frequently used
export const EditProfileForm = lazy(() => 
  import('@/components/common/EditProfileForm').then(module => ({
    default: module.EditProfileForm
  }))
);

export const PrivacySettings = lazy(() => 
  import('@/components/common/PrivacySettings').then(module => ({
    default: module.PrivacySettings
  }))
);

export const MediaGallery = lazy(() => 
  import('@/components/common/MediaGallery').then(module => ({
    default: module.MediaGallery
  }))
);