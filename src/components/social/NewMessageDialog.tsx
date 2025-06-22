import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import { DirectMessageDialog } from './DirectMessageDialog';

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewMessageDialog({ isOpen, onClose }: NewMessageDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [selectedPubkey, setSelectedPubkey] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  // Helper function to resolve NIP-05 identifier
  const resolveNip05 = async (identifier: string): Promise<{ pubkey: string; name?: string } | null> => {
    try {
      // Parse the identifier
      const parts = identifier.split('@');
      if (parts.length !== 2) {
        throw new Error('Invalid NIP-05 format');
      }
      
      const [name, domain] = parts;
      
      // Fetch the .well-known/nostr.json file
      let url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      let response = await fetch(url);
      
      // If direct fetch fails, try with a CORS proxy
      if (!response.ok) {
        const corsProxy = 'https://corsproxy.io/?';
        url = `${corsProxy}${encodeURIComponent(url)}`;
        response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch NIP-05 data');
        }
      }
      
      const data = await response.json();
      
      // Check if the name exists in the response
      if (!data.names || !data.names[name]) {
        throw new Error('Name not found in NIP-05 data');
      }
      
      // Validate the pubkey format
      const resolvedPubkey = data.names[name];
      if (!/^[0-9a-fA-F]{64}$/.test(resolvedPubkey)) {
        throw new Error('Invalid pubkey in NIP-05 data');
      }
      
      return { 
        pubkey: resolvedPubkey,
        name: name
      };
    } catch (error) {
      console.error('NIP-05 resolution error:', error);
      return null;
    }
  };
  
  const handleStartChat = async () => {
    let pubkey = searchTerm.trim();
    let displayName = '';
    
    setIsSearching(true);
    
    try {
      // Check if it's a NIP-05 identifier (contains @)
      if (pubkey.includes('@')) {
        const nip05Result = await resolveNip05(pubkey);
        if (nip05Result) {
          pubkey = nip05Result.pubkey;
          displayName = nip05Result.name || '';
        } else {
          toast({
            title: 'NIP-05 lookup failed',
            description: 'Could not resolve this NIP-05 identifier. Please check the address.',
            variant: 'destructive',
          });
          return;
        }
      }
      // Check if it's an npub and decode it
      else if (pubkey.startsWith('npub')) {
        try {
          const decoded = nip19.decode(pubkey);
          if (decoded.type === 'npub') {
            pubkey = decoded.data;
          } else {
            throw new Error('Invalid npub');
          }
        } catch {
          toast({
            title: 'Invalid npub',
            description: 'Please enter a valid npub, hex pubkey, or NIP-05 identifier',
            variant: 'destructive',
          });
          return;
        }
      }
      // Otherwise, validate as hex pubkey
      else if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
        toast({
          title: 'Invalid input',
          description: 'Please enter a valid npub, hex pubkey, or NIP-05 identifier (user@domain.com)',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedPubkey(pubkey);
      setSelectedName(displayName);
      setIsDirectMessageOpen(true);
      onClose();
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Message
            </DialogTitle>
            <DialogDescription>
              Start a new encrypted conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pubkey">Find by NIP-05, npub, or hex pubkey</Label>
              <div className="flex gap-2">
                <Input
                  id="pubkey"
                  placeholder="user@domain.com, npub1..., or hex"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching) {
                      handleStartChat();
                    }
                  }}
                  disabled={isSearching}
                />
                <Button 
                  onClick={handleStartChat}
                  disabled={!searchTerm.trim() || isSearching}
                  className="bg-caribbean-ocean hover:bg-caribbean-ocean/90"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Examples: alice@nostr.com, npub1abc..., or 64-character hex
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedPubkey && (
        <DirectMessageDialog
          isOpen={isDirectMessageOpen}
          onClose={() => {
            setIsDirectMessageOpen(false);
            setSelectedPubkey('');
            setSelectedName('');
            setSearchTerm('');
          }}
          recipientPubkey={selectedPubkey}
          recipientName={selectedName || undefined}
        />
      )}
    </>
  );
}