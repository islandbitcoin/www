import { useEffect, useRef, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useQueryClient } from '@tanstack/react-query';

interface UseNostrSubscriptionOptions {
  filters: NostrFilter[];
  enabled?: boolean;
  onEvent?: (event: NostrEvent) => void;
  queryKey?: unknown[];
}

export function useNostrSubscription({
  filters,
  enabled = true,
  onEvent,
  queryKey
}: UseNostrSubscriptionOptions) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());

  const handleEvent = useCallback((event: NostrEvent) => {
    // Deduplicate events
    if (seenEventsRef.current.has(event.id)) {
      return;
    }
    seenEventsRef.current.add(event.id);

    // Call custom handler if provided
    if (onEvent) {
      onEvent(event);
    }

    // Update query cache if queryKey is provided
    if (queryKey) {
      queryClient.setQueryData(queryKey, (oldData: NostrEvent[] | undefined) => {
        if (!oldData) return [event];
        
        // Check if event already exists
        const exists = oldData.some(e => e.id === event.id);
        if (exists) return oldData;
        
        // Add new event and sort by created_at
        const newData = [event, ...oldData];
        return newData.sort((a, b) => b.created_at - a.created_at);
      });
    }
  }, [onEvent, queryKey, queryClient]);

  useEffect(() => {
    if (!enabled || !nostr) {
      return;
    }

    // Clear seen events on new subscription
    seenEventsRef.current.clear();

    // Create subscription
    const abortController = new AbortController();
    
    const subscribe = async () => {
      try {
        // Use pool's subscription method
        const sub = await (nostr as unknown as { req: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<AsyncIterable<unknown[]>> }).req(filters, {
          signal: abortController.signal,
        });

        // Handle incoming events
        for await (const msg of sub) {
          if (msg[0] === 'EVENT') {
            handleEvent(msg[2] as NostrEvent);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Subscription error:', error);
        }
      }
    };

    subscribe();

    // Store unsubscribe function
    subscriptionRef.current = {
      unsubscribe: () => {
        abortController.abort();
      }
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [enabled, nostr, filters, handleEvent]);

  return {
    unsubscribe: () => subscriptionRef.current?.unsubscribe()
  };
}