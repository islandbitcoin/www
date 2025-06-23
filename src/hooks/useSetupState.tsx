import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNostrPublish } from '@/hooks/useNostrPublish';

const SETUP_STATE_KIND = 30078; // Application-specific data (NIP-78)
const SETUP_STATE_D_TAG = 'island-bitcoin-setup-v1';

interface SetupState {
  setupComplete: boolean;
  adminPubkeys: string[];
  timestamp: number;
}

export function useSetupState() {
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  // Query setup state from Nostr
  const { data: setupState, isLoading } = useQuery({
    queryKey: ['setup-state'],
    queryFn: async () => {
      try {
        const events = await nostr.query([{
          kinds: [SETUP_STATE_KIND],
          '#d': [SETUP_STATE_D_TAG],
          limit: 1,
        }], { signal: AbortSignal.timeout(3000) });

        if (events.length === 0) {
          return null;
        }

        const latestEvent = events[0];
        const content = JSON.parse(latestEvent.content) as SetupState;
        return content;
      } catch (error) {
        console.error('Failed to fetch setup state:', error);
        return null;
      }
    },
    // Check every 30 seconds
    refetchInterval: 30000,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to update setup state
  const updateSetupState = useMutation({
    mutationFn: async (state: SetupState) => {
      const content = JSON.stringify(state);
      
      await publishEvent({
        kind: SETUP_STATE_KIND,
        content,
        tags: [
          ['d', SETUP_STATE_D_TAG],
          ['client', 'island-bitcoin'],
        ],
      });
    },
    onSuccess: () => {
      // Invalidate the query to refetch
      queryClient.invalidateQueries({ queryKey: ['setup-state'] });
    },
  });

  const markSetupComplete = async (adminPubkeys: string[]) => {
    await updateSetupState.mutateAsync({
      setupComplete: true,
      adminPubkeys,
      timestamp: Date.now(),
    });
  };

  return {
    setupState,
    isLoading,
    markSetupComplete,
    isSetupComplete: setupState?.setupComplete ?? false,
    adminPubkeys: setupState?.adminPubkeys ?? [],
  };
}