import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameWallet } from '@/hooks/useGameWallet';

/**
 * Checks if initial setup is needed and redirects to setup wizard
 */
export function SetupCheck({ children }: { children: React.ReactNode }) {
  const { config } = useGameWallet();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Skip check if already on setup-related pages
    const setupPages = ['/setup', '/admin-setup'];
    if (setupPages.includes(location.pathname)) {
      return;
    }
    
    // Check if setup is needed (no admins configured)
    if (config.adminPubkeys.length === 0) {
      // Store the intended destination
      const returnTo = location.pathname !== '/' ? location.pathname : undefined;
      navigate('/setup', { state: { returnTo } });
    }
  }, [config.adminPubkeys, location.pathname, navigate]);
  
  return <>{children}</>;
}