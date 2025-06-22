# Nostr Implementation Improvement Plan

## Executive Summary

This document outlines a comprehensive plan to improve Island Bitcoin's Nostr implementation based on analysis of the Iris client and our current codebase. The goal is to enhance performance and functionality while maintaining our minimal feature set.

## Comparison: Iris vs Island Bitcoin

### Architecture

| Aspect | Iris Client | Island Bitcoin | Gap Analysis |
|--------|-------------|----------------|--------------|
| **Core Library** | NDK (Nostr Dev Kit) | Nostrify | Both are modern, but NDK has more features |
| **State Management** | Zustand | React Context + TanStack Query | Our approach is simpler but less flexible |
| **Caching** | Dexie (IndexedDB) + LRU | TanStack Query only | We lack persistent storage |
| **Relay Management** | NDK built-in pooling | NPool (Nostrify) | Similar capabilities |
| **Real-time Updates** | WebSocket subscriptions | Polling (30s intervals) | Major performance gap |
| **Social Graph** | Dedicated library | None | Missing feature affects content relevance |

### Performance Characteristics

| Feature | Iris | Island Bitcoin | Impact |
|---------|------|----------------|--------|
| **Profile Loading** | Cached in IndexedDB | Re-fetched each time | High latency |
| **Feed Updates** | Real-time via subscriptions | 30-second polling | Poor UX |
| **Event Deduplication** | Built-in | Manual | Potential duplicates |
| **Offline Support** | Service Worker + Cache | None | No offline access |
| **Query Efficiency** | Targeted filters | Fetches all profiles | Very inefficient |

## Implementation Plan

### Phase 1: Core Performance Improvements (Week 1-2)

#### 1.1 Optimize Community Feed Queries
**Problem**: Currently fetching 10,000 profiles to find community members
**Solution**: 
```typescript
// Before: Inefficient approach
const profiles = await nostr.query([{ kinds: [0], limit: 10000 }], { signal });

// After: Use search if available, or cache community members
const communityMembers = await getCachedCommunityMembers() || 
  await searchForCommunityMembers(domains);
```

**Implementation**:
- Add localStorage cache for verified community members
- Refresh cache daily
- Use NIP-50 search where supported
- Implement progressive discovery

#### 1.2 Add WebSocket Subscriptions
**Problem**: 30-second polling creates lag and wastes resources
**Solution**: Implement real-time subscriptions using Nostrify

```typescript
// New subscription-based approach
const subscription = nostr.subscribe(filters, {
  onevent(event) {
    // Update feed in real-time
    queryClient.setQueryData(['feed'], (old) => [event, ...old]);
  }
});
```

#### 1.3 Implement Event Caching
**Problem**: No persistent cache for events/profiles
**Solution**: Add IndexedDB caching layer

```typescript
// New caching service
class NostrCache {
  private db: IDBDatabase;
  
  async cacheEvent(event: NostrEvent) {
    await this.db.put('events', event);
  }
  
  async getCachedEvents(filters: NostrFilter) {
    // Return cached events matching filters
  }
}
```

### Phase 2: Connection Reliability (Week 2-3)

#### 2.1 Relay Health Monitoring
**Implementation**:
```typescript
interface RelayHealth {
  url: string;
  latency: number;
  errorRate: number;
  lastSeen: number;
}

class RelayMonitor {
  async checkHealth(relay: string): Promise<RelayHealth> {
    // Measure connection time and error rates
  }
  
  async getBestRelays(count: number): Promise<string[]> {
    // Return healthiest relays
  }
}
```

#### 2.2 Automatic Reconnection
- Implement exponential backoff for failed connections
- Add connection state to UI (connecting, connected, error)
- Automatic failover to backup relays

### Phase 3: User Experience Enhancements (Week 3-4)

#### 3.1 Optimistic UI Updates
**For posting**:
```typescript
const publishPost = useMutation({
  mutationFn: async (content: string) => {
    const event = await createEvent({ kind: 1, content });
    return nostr.publish(event);
  },
  onMutate: async (content) => {
    // Immediately show post in UI
    const optimisticEvent = createOptimisticEvent(content);
    queryClient.setQueryData(['feed'], old => [optimisticEvent, ...old]);
  },
  onError: (err, content, context) => {
    // Rollback on error
    queryClient.setQueryData(['feed'], context.previousFeed);
  }
});
```

#### 3.2 Infinite Scroll with Virtual Scrolling
- Replace pagination with infinite scroll
- Implement virtual scrolling for large feeds
- Progressive image loading

### Phase 4: Advanced Features (Week 4-5)

#### 4.1 Social Graph Integration
**Simple implementation without external library**:
```typescript
class SimpleSocialGraph {
  private follows: Map<string, Set<string>> = new Map();
  
  async loadFollows(pubkey: string) {
    const followList = await nostr.query([
      { kinds: [3], authors: [pubkey] }
    ]);
    // Parse and cache follow list
  }
  
  getFollowDistance(from: string, to: string): number {
    // Calculate social distance
  }
}
```

#### 4.2 Smart Feed Filtering
- Filter by follow distance (1st, 2nd degree connections)
- Prioritize posts from closer connections
- Option to hide posts beyond certain distance

### Implementation Priorities

1. **Immediate (This Week)**:
   - Fix community feed query efficiency
   - Add basic event caching
   - Implement connection status indicator

2. **Short Term (2 Weeks)**:
   - WebSocket subscriptions for real-time updates
   - Relay health monitoring
   - Optimistic UI updates

3. **Medium Term (1 Month)**:
   - Full IndexedDB caching
   - Social graph filtering
   - Progressive web app features

## Code Changes Required

### 1. Update NostrProvider
```typescript
// Add subscription support
const NostrProvider: React.FC<NostrProviderProps> = ({ children }) => {
  const subscriptions = useRef<Map<string, NSubscription>>(new Map());
  
  const subscribe = useCallback((filters, options) => {
    const sub = pool.current.subscribe(filters, options);
    subscriptions.current.set(sub.id, sub);
    return sub;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptions.current.forEach(sub => sub.close());
    };
  }, []);
  
  // ... rest of provider
};
```

### 2. Create Caching Service
```typescript
// New file: src/services/nostrCache.ts
import Dexie from 'dexie';

class NostrCacheDB extends Dexie {
  events!: Table<NostrEvent>;
  profiles!: Table<NostrMetadata>;
  
  constructor() {
    super('NostrCache');
    this.version(1).stores({
      events: 'id, pubkey, created_at, kind',
      profiles: 'pubkey, updated_at'
    });
  }
}

export const nostrCache = new NostrCacheDB();
```

### 3. Update Feed Hook
```typescript
// Enhanced feed hook with subscriptions
export function useNostrFeed(mode: 'community' | 'general' | 'hybrid') {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const filters = getFeedFilters(mode);
    const subscription = nostr.subscribe(filters, {
      onevent(event) {
        queryClient.setQueryData(
          ['feed', mode],
          (old: NostrEvent[] = []) => {
            // Deduplicate and sort
            const exists = old.some(e => e.id === event.id);
            if (exists) return old;
            return [event, ...old].sort((a, b) => b.created_at - a.created_at);
          }
        );
      }
    });
    
    return () => subscription.close();
  }, [mode, nostr, queryClient]);
  
  // ... rest of hook
}
```

## Testing Strategy

1. **Performance Testing**:
   - Measure feed load time before/after
   - Monitor WebSocket connection stability
   - Test with poor network conditions

2. **Cache Testing**:
   - Verify offline functionality
   - Test cache invalidation
   - Measure storage usage

3. **User Experience Testing**:
   - Real-time update latency
   - Optimistic update behavior
   - Error recovery scenarios

## Success Metrics

- **Feed Load Time**: < 1 second (from 3-5 seconds)
- **Real-time Updates**: < 100ms latency
- **Offline Capability**: Basic read functionality
- **Connection Reliability**: 99%+ uptime
- **Cache Hit Rate**: > 80% for profiles

## Risk Mitigation

1. **Backwards Compatibility**: All changes maintain existing API
2. **Progressive Enhancement**: Features degrade gracefully
3. **Rollback Plan**: Feature flags for new functionality
4. **Data Migration**: Automatic migration from old cache format

## Conclusion

This plan focuses on performance and reliability improvements while maintaining the minimal feature set of Island Bitcoin. The phased approach allows for incremental improvements with measurable impact at each stage.