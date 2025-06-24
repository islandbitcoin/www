/**
 * NostrFeed Component
 * 
 * A flexible Nostr feed component that supports multiple feed modes:
 * 
 * - 'community': Shows only posts from users with verified nip05 addresses matching configured domains
 * - 'general': Shows general kind-1 events from any users  
 * - 'hybrid': Prioritizes community posts, falls back to general posts when community is quiet
 * 
 * Props:
 * - domains: Array of community domains to filter by (defaults to siteConfig.nostr.communityDomains)
 * - limit: Maximum number of posts to show (default: 50)
 * - mode: Feed mode - 'community' | 'general' | 'hybrid' (default: 'hybrid')
 * - showDebugInfo: Show debug information about feed status (default: false)
 * 
 * The hybrid mode will show general posts when fewer than 5 community posts are found,
 * ensuring the feed always has content. Community posts are marked with a "Community" badge
 * in hybrid mode to help users distinguish sources.
 */

import { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/social/NoteContent';
import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site.config';
import { useNostrFeed } from '@/hooks/useNostrFeed';
import { MessageButton } from '@/components/social/MessageButton';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface NostrFeedProps {
  domains?: string[];
  limit?: number;
  mode: 'community' | 'general' | 'hybrid';
  showDebugInfo?: boolean;
}


function PostCard({ event, showSource = false, domains = [] }: { 
  event: NostrEvent; 
  showSource?: boolean;
  domains?: string[];
}) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const publishMutation = useNostrPublish();
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  // Check if this is a verified community member
  const isVerifiedCommunityMember = metadata?.nip05 && typeof metadata.nip05 === 'string' && domains.some(domain => 
    metadata.nip05?.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
  );

  // Query for reactions and reposts
  const { data: interactions } = useQuery({
    queryKey: ['interactions', event.id],
    queryFn: async () => {
      if (!nostr) return { likes: [], reposts: [], userLiked: false, userReposted: false };
      
      // Get likes (kind 7 with content "+")
      const likes = await nostr.query([{
        kinds: [7],
        '#e': [event.id],
      }], { signal: AbortSignal.timeout(5000) });
      
      // Get reposts (kind 6)
      const reposts = await nostr.query([{
        kinds: [6],
        '#e': [event.id],
      }], { signal: AbortSignal.timeout(5000) });
      
      const likesArray = Array.from(likes) as NostrEvent[];
      const repostsArray = Array.from(reposts) as NostrEvent[];
      
      // Filter to only positive reactions
      const positiveLikes = likesArray.filter(e => e.content === '+' || e.content === '');
      
      return {
        likes: positiveLikes,
        reposts: repostsArray,
        userLiked: user ? positiveLikes.some(e => e.pubkey === user.pubkey) : false,
        userReposted: user ? repostsArray.some(e => e.pubkey === user.pubkey) : false,
      };
    },
    enabled: !!nostr,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleReply = () => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }
    setShowReplyDialog(true);
  };

  const submitReply = async () => {
    if (!user || !replyContent.trim()) return;
    
    try {
      // Create reply event
      const replyEvent = {
        kind: 1,
        content: replyContent,
        tags: [
          ['e', event.id, '', 'reply'],
          ['p', event.pubkey],
          ...event.tags.filter(tag => tag[0] === 'p'), // Include all mentioned pubkeys
        ],
        created_at: Math.floor(Date.now() / 1000),
      };
      
      await publishMutation.mutateAsync(replyEvent);
      toast.success('Reply posted!');
      setShowReplyDialog(false);
      setReplyContent('');
    } catch (error) {
      console.error('Failed to post reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleRepost = async () => {
    if (!user) {
      toast.error('Please login to repost');
      return;
    }
    
    if (interactions?.userReposted) {
      toast.info('You already reposted this');
      return;
    }
    
    try {
      const repostEvent = {
        kind: 6,
        content: JSON.stringify(event),
        tags: [
          ['e', event.id, ''],
          ['p', event.pubkey],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };
      
      await publishMutation.mutateAsync(repostEvent);
      toast.success('Reposted!');
    } catch (error) {
      console.error('Failed to repost:', error);
      toast.error('Failed to repost');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    if (interactions?.userLiked) {
      toast.info('You already liked this');
      return;
    }
    
    try {
      const likeEvent = {
        kind: 7,
        content: '+',
        tags: [
          ['e', event.id, ''],
          ['p', event.pubkey],
          ['k', '1'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };
      
      await publishMutation.mutateAsync(likeEvent);
      toast.success('Liked!');
    } catch (error) {
      console.error('Failed to like:', error);
      toast.error('Failed to like');
    }
  };
  

  return (
    <>
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
                {showSource && isVerifiedCommunityMember && (
                  <Badge variant="secondary" className="text-xs bg-caribbean-ocean/10 text-caribbean-ocean">
                    Community
                  </Badge>
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-ocean"
              onClick={handleReply}
            >
              <MessageCircle className="h-4 w-4 sm:mr-1" />
              <span className="text-xs hidden sm:inline">Reply</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-1 sm:px-2 ${interactions?.userReposted ? 'text-caribbean-palm' : 'text-muted-foreground hover:text-caribbean-palm'}`}
              onClick={handleRepost}
            >
              <Repeat2 className="h-4 w-4 sm:mr-1" />
              <span className="text-xs hidden sm:inline">
                {interactions?.reposts.length || 0}
              </span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-1 sm:px-2 ${interactions?.userLiked ? 'text-caribbean-hibiscus' : 'text-muted-foreground hover:text-caribbean-hibiscus'}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 sm:mr-1 ${interactions?.userLiked ? 'fill-current' : ''}`} />
              <span className="text-xs hidden sm:inline">
                {interactions?.likes.length || 0}
              </span>
            </Button>
            <MessageButton 
              recipientPubkey={event.pubkey}
              recipientName={displayName}
              variant="ghost" 
              size="sm" 
              className="h-8 px-1 sm:px-2 text-muted-foreground hover:text-caribbean-ocean"
              showText={false}
            />
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reply to {displayName}</DialogTitle>
            <DialogDescription>
              Write your reply to this post.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="What's your reply?"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplyDialog(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReply}
                disabled={!replyContent.trim() || publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

export function NostrFeed({ 
  domains = siteConfig.nostr.communityDomains, 
  limit = 50, 
  mode,
  showDebugInfo = false 
}: NostrFeedProps) {
  
  const { data: feedData, isLoading, posts, debugInfo } = useNostrFeed({
    mode,
    domains,
    limit
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

  // Posts and debugInfo are directly from the hook now

  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-dashed border-caribbean-sand">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No posts found yet.
            </p>
            {mode === 'community' && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing posts from @{domains.join(', @')}
              </p>
            )}
            {showDebugInfo && debugInfo && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-left">
                <p><strong>Debug Info:</strong></p>
                <p>Mode: {debugInfo.mode}</p>
                <p>Relay Connected: {debugInfo.relayConnected ? '✅' : '❌'}</p>
                <p>Total profiles: {debugInfo.totalProfiles}</p>
                <p>Valid community pubkeys: {debugInfo.validCommunityPubkeys}</p>
                <p>Community posts: {debugInfo.communityPostsFound}</p>
                <p>General posts: {debugInfo.generalPostsFound}</p>
                <p>Domains: {debugInfo.domains.join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDebugInfo && debugInfo && (
        <Card className="border-caribbean-sand">
          <CardContent className="py-3">
            <div className="text-xs text-muted-foreground">
              <p><strong>Feed Status:</strong></p>
              <p>Mode: {debugInfo.mode} | Posts: {posts.length}</p>
              <p>Community: {debugInfo.communityPostsFound} | General: {debugInfo.generalPostsFound}</p>
              {feedData?.hasCommunityPosts && (
                <p className="text-caribbean-ocean">✓ Community posts available</p>
              )}
              {feedData?.hasGeneralPosts && !feedData?.hasCommunityPosts && (
                <p className="text-caribbean-mango">⚡ Showing general posts</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          event={post} 
          showSource={mode === 'hybrid'} 
          domains={domains}
        />
      ))}
    </div>
  );
}