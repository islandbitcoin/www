import React, { useEffect, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config, presetRelays } = useAppContext();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);
  const allRelays = useRef<Set<string>>(new Set());

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    
    // Build a set of relays to use for queries
    const relays = new Set<string>([config.relayUrl]);
    
    // Add preset relays, up to 6 total for queries for better coverage
    for (const { url } of (presetRelays ?? [])) {
      if (relays.size >= 6) break;
      relays.add(url);
    }
    
    allRelays.current = relays;
    );
    
    queryClient.resetQueries();
  }, [config.relayUrl, presetRelays, queryClient]);

  // Initialize allRelays if empty
  if (allRelays.current.size === 0) {
    const relays = new Set<string>([config.relayUrl]);
    for (const { url } of (presetRelays ?? [])) {
      if (relays.size >= 6) break;
      relays.add(url);
    }
    allRelays.current = relays;
  }

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        // Query from multiple relays for better coverage
        const relayMap = new Map<string, typeof filters>();
        
        // Use all relays in our set
        for (const relay of allRelays.current) {
          relayMap.set(relay, filters);
        }
        
        // If no relays are set yet, use at least the main relay
        if (relayMap.size === 0) {
          relayMap.set(relayUrl.current, filters);
        }
        
        // Debug logging - commented out to reduce console noise
        // ));
        
        return relayMap;
      },
      eventRouter(_event: NostrEvent) {
        // Publish to the selected relay and preset relays
        const publishRelays = new Set<string>([relayUrl.current]);

        // Also publish to the preset relays, capped to 5
        for (const { url } of (presetRelays ?? [])) {
          publishRelays.add(url);

          if (publishRelays.size >= 5) {
            break;
          }
        }

        );

        return [...publishRelays];
      },
    });
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;