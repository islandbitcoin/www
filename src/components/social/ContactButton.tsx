import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import { useState } from 'react';
import { DirectMessageDialog } from './DirectMessageDialog';

interface ContactButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ContactButton({ className, variant = 'ghost', size = 'sm' }: ContactButtonProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [isDMOpen, setIsDMOpen] = useState(false);
  
  // Island Bitcoin npub
  const islandBitcoinNpub = 'npub1jmccux3kgat5hkk0kwmyzukxdvumu6u3w2g0ztrlrz7dptkkhgkqe3qd00';
  
  // Decode npub to hex pubkey
  let islandBitcoinPubkey = '';
  try {
    const decoded = nip19.decode(islandBitcoinNpub);
    if (decoded.type === 'npub') {
      islandBitcoinPubkey = decoded.data;
    }
  } catch (error) {
    console.error('Failed to decode Island Bitcoin npub:', error);
  }
  
  const handleContactClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in with Nostr to send a message to Island Bitcoin',
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
        onClick={handleContactClick}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Contact
      </Button>
      
      {user && islandBitcoinPubkey && (
        <DirectMessageDialog
          isOpen={isDMOpen}
          onClose={() => setIsDMOpen(false)}
          recipientPubkey={islandBitcoinPubkey}
          recipientName="Island Bitcoin"
        />
      )}
    </>
  );
}