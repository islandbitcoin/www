import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Send, Loader2, Shield } from 'lucide-react';
import { useEncryptedDMs } from '@/hooks/useEncryptedDMs';
import { useToast } from '@/hooks/useToast';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { genUserName } from '@/lib/genUserName';

interface DirectMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPubkey: string;
  recipientName?: string;
}

export function DirectMessageDialog({ 
  isOpen, 
  onClose, 
  recipientPubkey,
  recipientName 
}: DirectMessageDialogProps) {
  const [message, setMessage] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { sendDM } = useEncryptedDMs();
  const { toast } = useToast();
  const author = useAuthor(recipientPubkey);
  
  const metadata = author.data?.metadata;
  const displayName = recipientName || metadata?.name || genUserName(recipientPubkey);
  const profileImage = metadata?.picture;
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Empty message',
        description: 'Please write a message before sending',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      await sendDM(recipientPubkey, message.trim(), {
        ephemeral: isEphemeral,
      });
      
      toast({
        title: 'Message sent!',
        description: `Your message to ${displayName} has been encrypted and sent.`,
      });
      
      setMessage('');
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>Message {displayName}</span>
          </DialogTitle>
          <DialogDescription>
            Send an encrypted direct message
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSending}
            />
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-caribbean-ocean/5 rounded-lg">
            <Shield className="h-4 w-4 text-caribbean-ocean" />
            <Label htmlFor="ephemeral" className="text-sm flex-1 cursor-pointer">
              Ephemeral message (auto-deletes after reading)
            </Label>
            <Switch
              id="ephemeral"
              checked={isEphemeral}
              onCheckedChange={setIsEphemeral}
              disabled={isSending}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="bg-caribbean-ocean hover:bg-caribbean-ocean/90"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}