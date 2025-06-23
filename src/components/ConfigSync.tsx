import { useEffect } from 'react';
import { gameWalletManager } from '@/lib/wallet';
import { useNostrConfigSync } from '@/hooks/useNostrConfigSync';

/**
 * Loads configuration from server/Nostr on startup and keeps it synchronized
 */
export function ConfigSync({ children }: { children: React.ReactNode }) {
  // Initialize Nostr config sync
  useNostrConfigSync();
  
  useEffect(() => {
    // Load config on mount
    const loadConfig = async () => {
      try {
        console.log('[ConfigSync] Loading config...');
        const success = await gameWalletManager.loadConfigFromServer();
        if (success) {
          console.log('[ConfigSync] Config loaded successfully');
        } else {
          console.log('[ConfigSync] No remote config available, using local config');
        }
      } catch (error) {
        console.error('[ConfigSync] Failed to load config:', error);
      }
    };
    
    // Delay slightly to ensure Nostr is initialized
    const timer = setTimeout(loadConfig, 1500);
    
    // Also listen for config updates
    const handleConfigUpdate = () => {
      console.log('[ConfigSync] Config updated, reloading...');
      loadConfig();
    };
    
    window.addEventListener('gameWalletConfigUpdate', handleConfigUpdate);
    
    // Reload config periodically (every 5 minutes)
    const interval = setInterval(loadConfig, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('gameWalletConfigUpdate', handleConfigUpdate);
    };
  }, []);
  
  return <>{children}</>;
}