import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthor } from '@/hooks/useAuthor';
import { generateCaribbeanProfile } from '@/lib/caribbeanProfile';
import { useToast } from '@/hooks/useToast';

export function useCaribbeanProfile() {
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    // Check if user already has a profile
    if (author.data?.metadata) return;
    
    // Generate Caribbean-themed profile after a short delay
    const timer = setTimeout(() => {
      const caribbeanMetadata = generateCaribbeanProfile(user.pubkey);
      
      createEvent(
        {
          kind: 0,
          content: JSON.stringify(caribbeanMetadata),
        },
        {
          onSuccess: () => {
            toast({
              title: 'Welcome to Island Bitcoin! 🏝️',
              description: `Your Caribbean profile has been created as ${caribbeanMetadata.name}`,
            });
          },
          onError: (error) => {
            console.error('Failed to create profile:', error);
          },
        }
      );
    }, 2000); // 2 second delay to avoid race conditions

    return () => clearTimeout(timer);
  }, [user, author.data, createEvent, toast]);
  
  return { isGenerating: !author.data?.metadata && !!user };
}