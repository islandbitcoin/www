import { useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { nostrConfigSyncService } from '@/lib/nostrConfigSync';

/**
 * Hook to initialize Nostr config sync service
 */
export function useNostrConfigSync() {
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useNostrPublish();

  useEffect(() => {
    // Initialize the service with Nostr instance
    nostrConfigSyncService.init(nostr, publishEvent);
  }, [nostr, publishEvent]);

  return nostrConfigSyncService;
}