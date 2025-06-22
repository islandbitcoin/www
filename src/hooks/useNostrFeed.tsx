import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostrSubscription } from './useNostrSubscription';
import { CommunityMemberCache } from '@/services/communityCache';
import { useCallback, useMemo } from 'react';

interface UseNostrFeedOptions {
  mode: 'community' | 'general' | 'hybrid';
  domains: string[];
  limit: number;
}

interface FeedData {
  posts: NostrEvent[];
  debugInfo: {
    totalProfiles: number;
    validCommunityPubkeys: number;
    communityPostsFound: number;
    generalPostsFound: number;
    mode: string;
    domains: string[];
    relayConnected: boolean;
  };
  hasCommunityPosts: boolean;
  hasGeneralPosts: boolean;
}

export function useNostrFeed({ mode, domains, limit }: UseNostrFeedOptions) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['nostr-feed', domains, limit, mode], [domains, limit, mode]);

  // Get initial data from cache or fetch
  const { data: feedData, isLoading } = useQuery<FeedData>({
    queryKey,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      
      let communityPosts: NostrEvent[] = [];
      let generalPosts: NostrEvent[] = [];
      const debugInfo = {
        totalProfiles: 0,
        validCommunityPubkeys: 0,
        communityPostsFound: 0,
        generalPostsFound: 0,
        mode,
        domains,
        relayConnected: true
      };

      // Get community members
      const cache = CommunityMemberCache.getInstance();
      let validPubkeys: string[] = [];
      
      const cachedMembers = cache.getCachedMembers();
      if (cachedMembers && cachedMembers.length > 0) {
        console.log(`📦 Using ${cachedMembers.length} cached community members`);
        validPubkeys = cachedMembers.map(m => m.pubkey);
        debugInfo.validCommunityPubkeys = cachedMembers.length;
      } else {
        // Fetch profiles if not cached
        console.log('📡 No cache found, querying for community members...');
        const profiles = await nostr.query([{ kinds: [0], limit: 5000 }], { signal });
        debugInfo.totalProfiles = profiles.length;
        
        // Update cache
        cache.updateCache(profiles, domains);
        const updatedMembers = cache.getCachedMembers() || [];
        validPubkeys = updatedMembers.map(m => m.pubkey);
        debugInfo.validCommunityPubkeys = validPubkeys.length;
      }

      // Fetch posts based on mode
      if ((mode === 'community' || mode === 'hybrid') && validPubkeys.length > 0) {
        communityPosts = await nostr.query([{
          kinds: [1],
          authors: validPubkeys,
          limit: limit,
        }], { signal });
        debugInfo.communityPostsFound = communityPosts.length;
      }

      if (mode === 'general' || mode === 'hybrid') {
        const remainingLimit = mode === 'general' ? limit : Math.max(10, limit - communityPosts.length);
        generalPosts = await nostr.query([{
          kinds: [1],
          limit: remainingLimit,
        }], { signal });
        debugInfo.generalPostsFound = generalPosts.length;

        // Filter general posts by profile pictures if in general mode
        if (mode === 'general') {
          const authorPubkeys = [...new Set(generalPosts.map(post => post.pubkey))];
          const authorProfiles = await nostr.query([{
            kinds: [0],
            authors: authorPubkeys
          }], { signal });
          
          const pubkeysWithPictures = new Set<string>();
          for (const profile of authorProfiles) {
            try {
              const metadata = JSON.parse(profile.content);
              if (metadata.picture && metadata.picture.trim()) {
                pubkeysWithPictures.add(profile.pubkey);
              }
            } catch {
              // Skip invalid profiles
            }
          }
          
          generalPosts = generalPosts.filter(post => pubkeysWithPictures.has(post.pubkey));
        }
      }

      // Combine and deduplicate posts
      const allPosts = [...communityPosts, ...generalPosts];
      const uniquePosts = allPosts.filter((post, index, arr) => 
        arr.findIndex(p => p.id === post.id) === index
      );
      const sortedPosts = uniquePosts.sort((a, b) => b.created_at - a.created_at);

      return {
        posts: sortedPosts.slice(0, limit),
        debugInfo,
        hasCommunityPosts: communityPosts.length > 0,
        hasGeneralPosts: generalPosts.length > 0
      };
    },
    refetchInterval: false, // Disable polling, we'll use subscriptions
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Build subscription filters based on mode and community members
  const subscriptionFilters = useMemo(() => {
    const filters: NostrFilter[] = [];
    const cache = CommunityMemberCache.getInstance();
    const cachedMembers = cache.getCachedMembers();
    
    if ((mode === 'community' || mode === 'hybrid') && cachedMembers && cachedMembers.length > 0) {
      const validPubkeys = cachedMembers.map(m => m.pubkey);
      filters.push({
        kinds: [1],
        authors: validPubkeys,
        since: Math.floor(Date.now() / 1000),
      });
    }

    if (mode === 'general' || mode === 'hybrid') {
      filters.push({
        kinds: [1],
        since: Math.floor(Date.now() / 1000),
        limit: 50
      });
    }

    return filters;
  }, [mode]);

  // Handle new events from subscription
  const handleNewEvent = useCallback((event: NostrEvent) => {
    // For general mode, check if author has profile picture
    if (mode === 'general') {
      // Queue a check for profile picture
      nostr.query([{
        kinds: [0],
        authors: [event.pubkey]
      }]).then(profiles => {
        if (profiles.length > 0) {
          try {
            const metadata = JSON.parse(profiles[0].content);
            if (!metadata.picture || !metadata.picture.trim()) {
              return; // Skip if no picture
            }
          } catch {
            return; // Skip if invalid metadata
          }
        } else {
          return; // Skip if no profile
        }

        // Update the query data with the new event
        queryClient.setQueryData(queryKey, (old: FeedData | undefined) => {
          if (!old) return old;
          
          // Check if event already exists
          const exists = old.posts.some(p => p.id === event.id);
          if (exists) return old;
          
          // Add new post and maintain sort order
          const newPosts = [event, ...old.posts]
            .sort((a, b) => b.created_at - a.created_at)
            .slice(0, limit);
          
          return {
            ...old,
            posts: newPosts
          };
        });
      });
    } else {
      // For community/hybrid modes, directly add the event
      queryClient.setQueryData(queryKey, (old: FeedData | undefined) => {
        if (!old) return old;
        
        // Check if event already exists
        const exists = old.posts.some(p => p.id === event.id);
        if (exists) return old;
        
        // Add new post and maintain sort order
        const newPosts = [event, ...old.posts]
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, limit);
        
        return {
          ...old,
          posts: newPosts
        };
      });
    }
  }, [mode, nostr, queryClient, queryKey, limit]);

  // Set up real-time subscription
  useNostrSubscription({
    filters: subscriptionFilters,
    enabled: !isLoading && !!feedData,
    onEvent: handleNewEvent
  });

  return {
    data: feedData,
    isLoading,
    posts: feedData?.posts || [],
    debugInfo: feedData?.debugInfo
  };
}