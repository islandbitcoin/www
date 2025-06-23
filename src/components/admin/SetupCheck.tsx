import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useSetupState } from '@/hooks/useSetupState';

/**
 * Checks if initial setup is needed and redirects to setup wizard
 */
export function SetupCheck({ children }: { children: React.ReactNode }) {
  const { config } = useGameWallet();
  const { isSetupComplete, isLoading: isLoadingSetupState } = useSetupState();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Skip check if already on setup-related pages
    const setupPages = ['/setup', '/admin-setup'];
    if (setupPages.includes(location.pathname)) {
      return;
    }
    
    // Wait for setup state to load
    if (isLoadingSetupState) {
      return;
    }
    
    // Check both Nostr setup state and local config
    const needsSetup = !isSetupComplete && config.adminPubkeys.length === 0;
    
    if (needsSetup) {
      // Store the intended destination
      const returnTo = location.pathname !== '/' ? location.pathname : undefined;
      navigate('/setup', { state: { returnTo } });
    }
  }, [config.adminPubkeys, location.pathname, navigate, isSetupComplete, isLoadingSetupState]);
  
  return <>{children}</>;
}