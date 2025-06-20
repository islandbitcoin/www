import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function NostrPostBox() {
  const [content, setContent] = useState('');
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: 'Empty post',
        description: 'Please write something before posting.',
        variant: 'destructive',
      });
      return;
    }

    createEvent(
      { 
        kind: 1, 
        content: content.trim(),
        tags: [['t', 'islandbitcoin']],
      },
      {
        onSuccess: () => {
          setContent('');
          toast({
            title: 'Posted!',
            description: 'Your note has been published to Nostr.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to post',
            description: error.message || 'Something went wrong.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!user) {
    return (
      <Card className="border-caribbean-sand border-dashed">
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-caribbean-ocean/50" />
          <p className="text-sm text-muted-foreground">
            Sign in with Nostr to share your thoughts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-caribbean-ocean/20">
      <CardContent className="pt-4 pb-3">
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="What's happening in the islands? 🏝️"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none border-caribbean-sand focus:border-caribbean-ocean"
            disabled={isPending}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">
              {280 - content.length} characters remaining
            </span>
            <Button 
              type="submit" 
              size="sm"
              disabled={isPending || !content.trim()}
              className="bg-caribbean-ocean hover:bg-caribbean-ocean/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}