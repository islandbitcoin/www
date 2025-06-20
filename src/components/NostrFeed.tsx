import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import { Heart, MessageCircle, Repeat2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site.config';

interface NostrFeedProps {
  domains?: string[];
}

function PostCard({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  return (
    <Card className="border-caribbean-sand hover:border-caribbean-ocean/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profileImage} alt={displayName} loading="lazy" />
            <AvatarFallback className="bg-caribbean-ocean/10 text-caribbean-ocean">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{displayName}</span>
              {metadata?.nip05 && (
                <span className="text-xs text-caribbean-ocean">✓</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="whitespace-pre-wrap break-words text-sm">
          <NoteContent event={event} />
        </div>
        <div className="flex items-center gap-1 sm:gap-4 mt-4">
          <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-ocean">
            <MessageCircle className="h-4 w-4 sm:mr-1" />
            <span className="text-xs hidden sm:inline">Reply</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-palm">
            <Repeat2 className="h-4 w-4 sm:mr-1" />
            <span className="text-xs hidden sm:inline">Repost</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-hibiscus">
            <Heart className="h-4 w-4 sm:mr-1" />
            <span className="text-xs hidden sm:inline">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-mango">
            <Zap className="h-4 w-4 sm:mr-1" />
            <span className="text-xs hidden sm:inline">Zap</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-caribbean-sand">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function NostrFeed({ domains = siteConfig.nostr.communityDomains }: NostrFeedProps) {
  const { nostr } = useNostr();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['nostr-feed', domains],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // First, find users with the specified nip05 domains
      const profiles = await nostr.query([{ kinds: [0] }], { signal });
      
      // Filter profiles with matching nip05 domains
      const validPubkeys = profiles
        .filter(event => {
          try {
            const metadata = JSON.parse(event.content);
            if (!metadata.nip05) return false;
            const domain = metadata.nip05.split('@').pop();
            return domains.includes(domain || '');
          } catch {
            return false;
          }
        })
        .map(event => event.pubkey);

      if (validPubkeys.length === 0) {
        return [];
      }

      // Query posts from these users
      const posts = await nostr.query([
        {
          kinds: [1],
          authors: validPubkeys,
          limit: 50,
        }
      ], { signal });

      // Sort by created_at descending
      return posts.sort((a, b) => b.created_at - a.created_at);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="border-dashed border-caribbean-sand">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            No posts found from the community yet.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Showing posts from @{domains.join(', @')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} event={post} />
      ))}
    </div>
  );
}