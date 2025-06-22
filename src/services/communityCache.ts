import { NostrEvent } from '@nostrify/nostrify';

interface CommunityMember {
  pubkey: string;
  nip05: string;
  name?: string;
  picture?: string;
  lastUpdated: number;
}

interface CommunityCache {
  members: CommunityMember[];
  lastRefresh: number;
}

const CACHE_KEY = 'islandbitcoin:community-members';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class CommunityMemberCache {
  private static instance: CommunityMemberCache;
  
  static getInstance(): CommunityMemberCache {
    if (!CommunityMemberCache.instance) {
      CommunityMemberCache.instance = new CommunityMemberCache();
    }
    return CommunityMemberCache.instance;
  }

  private loadCache(): CommunityCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as CommunityCache;
      
      // Check if cache is expired
      if (Date.now() - data.lastRefresh > CACHE_DURATION) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load community cache:', error);
      return null;
    }
  }

  private saveCache(cache: CommunityCache): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save community cache:', error);
    }
  }

  getCachedMembers(): CommunityMember[] | null {
    const cache = this.loadCache();
    return cache?.members || null;
  }

  getCachedPubkeys(): string[] | null {
    const members = this.getCachedMembers();
    return members ? members.map(m => m.pubkey) : null;
  }

  updateCache(profiles: NostrEvent[], domains: string[]): void {
    const members: CommunityMember[] = [];
    
    for (const event of profiles) {
      try {
        const metadata = JSON.parse(event.content);
        
        // Check if this is a community member
        if (metadata.nip05 && typeof metadata.nip05 === 'string') {
          const isVerified = domains.some(domain => 
            metadata.nip05.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
          );
          
          if (isVerified) {
            members.push({
              pubkey: event.pubkey,
              nip05: metadata.nip05,
              name: metadata.name || metadata.display_name,
              picture: metadata.picture,
              lastUpdated: event.created_at
            });
          }
        }
      } catch {
        // Skip invalid profiles
      }
    }
    
    const cache: CommunityCache = {
      members,
      lastRefresh: Date.now()
    };
    
    this.saveCache(cache);
    console.log(`📦 Cached ${members.length} community members`);
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  // Get member by pubkey
  getMember(pubkey: string): CommunityMember | undefined {
    const members = this.getCachedMembers();
    return members?.find(m => m.pubkey === pubkey);
  }

  // Check if a pubkey is a verified community member
  isVerifiedMember(pubkey: string): boolean {
    const members = this.getCachedMembers();
    return members?.some(m => m.pubkey === pubkey) || false;
  }
}