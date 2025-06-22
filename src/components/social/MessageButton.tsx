import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useState } from 'react';
import { DirectMessageDialog } from './DirectMessageDialog';

interface MessageButtonProps {
  recipientPubkey: string;
  recipientName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function MessageButton({ 
  recipientPubkey,
  recipientName,
  className, 
  variant = 'ghost', 
  size = 'sm',
  showText = true
}: MessageButtonProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [isDMOpen, setIsDMOpen] = useState(false);
  
  const handleMessageClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in with Nostr to send a message',
        variant: 'destructive',
      });
      return;
    }
    
    // Don't allow messaging yourself
    if (recipientPubkey === user.pubkey) {
      toast({
        title: 'Cannot message yourself',
        description: 'You cannot send a message to yourself',
        variant: 'destructive',
      });
      return;
    }
    
    setIsDMOpen(true);
  };
  
  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={handleMessageClick}
        title={showText ? undefined : 'Send message'}
      >
        <MessageSquare className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {showText && 'Message'}
      </Button>
      
      {user && (
        <DirectMessageDialog
          isOpen={isDMOpen}
          onClose={() => setIsDMOpen(false)}
          recipientPubkey={recipientPubkey}
          recipientName={recipientName}
        />
      )}
    </>
  );
}