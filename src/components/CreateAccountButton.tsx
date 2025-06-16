import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostr } from '@nostrify/react';
import { generateSecretKey, getPublicKey, nip19, finalizeEvent } from 'nostr-tools';

interface CreateAccountButtonProps {
  onAccountCreated?: () => void;
  className?: string;
}

export function CreateAccountButton({ onAccountCreated, className }: CreateAccountButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { nostr } = useNostr();
  const addLogin = useLoginActions();

  const generateRandomName = () => {
    const adjectives = [
      'Sovereign', 'Lightning', 'Satoshi', 'Digital', 'Crypto', 'Decentralized',
      'Orange', 'Stack', 'HODL', 'Diamond', 'Citadel', 'Freedom', 'Sound',
      'Peer', 'Trustless', 'Cypherpunk', 'Proof', 'Hash', 'Block', 'Chain'
    ];
    
    const nouns = [
      'Bitcoiner', 'Stacker', 'HODLer', 'Maximalist', 'Plebs', 'Builder',
      'Miner', 'Node', 'Wallet', 'Key', 'Satoshi', 'Lightning', 'Channel',
      'Peer', 'Validator', 'Guardian', 'Pioneer', 'Advocate', 'Enthusiast', 'Rebel'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${adjective}${noun}${number}`;
  };

  const createAccount = async () => {
    setIsCreating(true);
    
    try {
      // Generate new Nostr keypair
      const secretKey = generateSecretKey();
      const publicKey = getPublicKey(secretKey);
      const npub = nip19.npubEncode(publicKey);
      const nsec = nip19.nsecEncode(secretKey);
      
      // Generate random name and metadata
      const randomName = generateRandomName();
      const nip05 = `${npub}@islandbitcoin.com`;
      
      const metadata = {
        name: randomName,
        display_name: randomName,
        about: "New member of the Island Bitcoin community! 🟠⚡ Building a sovereign future with Bitcoin and Nostr.",
        nip05: nip05,
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey}&backgroundColor=f97316,eab308&scale=80`,
        banner: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1024&h=300&fit=crop&crop=center",
        website: "https://island-bitcoin.surge.sh",
        lud16: "", // User can add their Lightning address later
      };

      // Create and sign the metadata event directly with the new keys
      const unsignedEvent = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(metadata),
        pubkey: publicKey,
      };

      // Sign the event with the secret key
      const signedEvent = finalizeEvent(unsignedEvent, secretKey);

      // Publish the event to Nostr relays
      await nostr.event(signedEvent);

      // Add the login after successfully publishing the profile
      addLogin.nsec(nsec);

      // Show success message
      toast({
        title: "Account Created! 🎉",
        description: `Welcome to Island Bitcoin, ${randomName}! Your account is ready.`,
      });

      // Wait a moment for the login to be processed, then navigate
      setTimeout(() => {
        onAccountCreated?.();
      }, 500);

    } catch (error) {
      console.error('Failed to create account:', error);
      toast({
        title: "Account Creation Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={createAccount}
      disabled={isCreating}
      className={`bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white ${className}`}
    >
      {isCreating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating Account...
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Create Account
        </>
      )}
    </Button>
  );
}