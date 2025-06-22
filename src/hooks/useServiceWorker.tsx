import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface ServiceWorkerState {
  isInstalled: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdating: false,
    registration: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setState(prev => ({ ...prev, registration }));

        // Check if service worker is already installed
        if (registration.active) {
          setState(prev => ({ ...prev, isInstalled: true }));
        }

        // Listen for installation
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                setState(prev => ({ ...prev, isUpdating: true }));
                toast({
                  title: 'Update available! 🎉',
                  description: 'A new version is ready. Refresh to update.',
                  action: (
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm font-medium text-caribbean-ocean hover:underline"
                    >
                      Refresh
                    </button>
                  ),
                });
              } else {
                // First install
                setState(prev => ({ ...prev, isInstalled: true }));
                toast({
                  title: 'App ready for offline use! 🏝️',
                  description: 'Island Bitcoin will now work even without internet.',
                });
              }
            }
          };
        };

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Listen for controller change (new service worker activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

  }, [toast]);

  const skipWaiting = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    ...state,
    skipWaiting,
  };
}