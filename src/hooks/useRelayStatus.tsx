import { useState, useEffect, useRef } from 'react';
import { useAppContext } from './useAppContext';

export type RelayStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface RelayInfo {
  url: string;
  status: RelayStatus;
  latency?: number;
  lastError?: string;
}

export function useRelayStatus() {
  const { config, presetRelays } = useAppContext();
  const [relayStatuses, setRelayStatuses] = useState<Map<string, RelayInfo>>(new Map());
  const [overallStatus, setOverallStatus] = useState<RelayStatus>('connecting');
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Build list of relays to monitor
    const relaysToMonitor = new Set<string>([config.relayUrl]);
    
    // Add preset relays (up to 6 total)
    for (const { url } of (presetRelays ?? [])) {
      if (relaysToMonitor.size >= 6) break;
      relaysToMonitor.add(url);
    }

    // Initialize relay statuses
    const initialStatuses = new Map<string, RelayInfo>();
    for (const url of relaysToMonitor) {
      initialStatuses.set(url, {
        url,
        status: 'connecting'
      });
    }
    setRelayStatuses(initialStatuses);

    // Check relay connections
    const checkRelays = async () => {
      const updates = new Map<string, RelayInfo>();
      
      for (const url of relaysToMonitor) {
        try {
          const startTime = performance.now();
          const ws = new WebSocket(url);
          
          const timeout = setTimeout(() => {
            ws.close();
            updates.set(url, {
              url,
              status: 'error',
              lastError: 'Connection timeout'
            });
          }, 5000);

          ws.onopen = () => {
            clearTimeout(timeout);
            const latency = Math.round(performance.now() - startTime);
            updates.set(url, {
              url,
              status: 'connected',
              latency
            });
            ws.close();
          };

          ws.onerror = (_error) => {
            clearTimeout(timeout);
            updates.set(url, {
              url,
              status: 'error',
              lastError: 'Connection failed'
            });
          };

          ws.onclose = () => {
            clearTimeout(timeout);
            if (!updates.has(url)) {
              updates.set(url, {
                url,
                status: 'disconnected'
              });
            }
          };
        } catch (error) {
          updates.set(url, {
            url,
            status: 'error',
            lastError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Wait for all checks to complete
      await new Promise(resolve => setTimeout(resolve, 5500));
      
      setRelayStatuses(updates);
      
      // Calculate overall status
      const statuses = Array.from(updates.values());
      const connectedCount = statuses.filter(r => r.status === 'connected').length;
      
      if (connectedCount === 0) {
        setOverallStatus('error');
      } else if (connectedCount < statuses.length / 2) {
        setOverallStatus('disconnected');
      } else {
        setOverallStatus('connected');
      }
    };

    // Initial check
    checkRelays();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(checkRelays, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [config.relayUrl, presetRelays]);

  const getConnectedRelays = (): RelayInfo[] => {
    return Array.from(relayStatuses.values()).filter(r => r.status === 'connected');
  };

  const getBestRelays = (count: number = 3): string[] => {
    return getConnectedRelays()
      .sort((a, b) => (a.latency || 999) - (b.latency || 999))
      .slice(0, count)
      .map(r => r.url);
  };

  return {
    relayStatuses,
    overallStatus,
    getConnectedRelays,
    getBestRelays,
    connectedCount: getConnectedRelays().length,
    totalCount: relayStatuses.size
  };
}