import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RelaySelector } from '@/components/RelaySelector';
import { useNostr } from '@nostrify/react';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import type { NostrEvent } from '@nostrify/nostrify';

function PostSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Post({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  
  const displayName = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Extract hashtags from the event
  const hashtags = event.tags
    .filter(([tagName]) => tagName === 't')
    .map(([, tagValue]) => tagValue)
    .filter(Boolean);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              {metadata?.nip05 && (
                <Badge variant="secondary" className="text-xs">
                  ✓
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="whitespace-pre-wrap break-words mb-4">
          <NoteContent event={event} className="text-sm" />
        </div>
        
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {hashtags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Heart className="w-4 h-4 mr-1" />
            <span className="text-xs">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Repeat2 className="w-4 h-4 mr-1" />
            <span className="text-xs">Repost</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Zap className="w-4 h-4 mr-1" />
            <span className="text-xs">Zap</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BitcoinFeed() {
  const { nostr } = useNostr();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['bitcoin-feed'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query([
        { 
          kinds: [1], 
          '#t': ['bitcoin', 'btc', 'lightning', 'nostr', 'sovereignty', 'freedom'],
          limit: 20 
        }
      ], { signal });
      
      // Sort by creation time (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !posts || posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <p className="text-muted-foreground">
                No Bitcoin discussions found. Try another relay?
              </p>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {posts.map((post) => (
        <Post key={post.id} event={post} />
      ))}
    </div>
  );
}