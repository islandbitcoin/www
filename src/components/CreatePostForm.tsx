import { useState } from 'react';
import { Send, Image, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';

export function CreatePostForm() {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['bitcoin']);
  const [newHashtag, setNewHashtag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();

  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim().toLowerCase())) {
      setHashtags([...hashtags, newHashtag.trim().toLowerCase()]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create tags for hashtags
      const tags = hashtags.map(tag => ['t', tag]);

      createEvent({
        kind: 1,
        content: content.trim(),
        tags,
      });

      // Reset form
      setContent('');
      setHashtags(['bitcoin']);
      
      toast({
        title: "Success",
        description: "Your post has been published to the Nostr network!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to share your thoughts with the community
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share with the Community</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind about Bitcoin, Lightning, or Nostr?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={280}
          />
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{content.length}/280 characters</span>
          </div>

          {/* Hashtags */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => removeHashtag(tag)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Add hashtag"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  className="pl-10"
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={addHashtag}
                disabled={!newHashtag.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" disabled>
                <Image className="w-4 h-4 mr-2" />
                Image
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {isSubmitting ? (
                <>Publishing...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}