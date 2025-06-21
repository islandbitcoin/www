import { useState, useCallback, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/lib/secureStorage';
import { nip19 } from 'nostr-tools';

interface DirectMessage {
  id: string;
  pubkey: string;
  content: string;
  decryptedContent?: string;
  createdAt: number;
  sent: boolean;
  encrypted: boolean;
  ephemeral?: boolean;
  expiresAt?: number;
}

interface Conversation {
  pubkey: string;
  messages: DirectMessage[];
  lastMessage?: DirectMessage;
  unreadCount: number;
}

export function useEncryptedDMs() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [decryptionCache] = useState<Map<string, string>>(new Map());

  // Decrypt message content
  const decryptMessage = useCallback(async (event: NostrEvent): Promise<string | null> => {
    if (!user?.signer.nip44) {
      toast({
        title: 'Encryption not supported',
        description: 'Please upgrade your signer to support encrypted messages',
        variant: 'destructive',
      });
      return null;
    }

    // Check cache first
    const cached = decryptionCache.get(event.id);
    if (cached) return cached;

    try {
      // Get the other party's pubkey
      const pTags = event.tags.filter(tag => tag[0] === 'p');
      const otherPubkey = pTags.find(tag => tag[1] !== user.pubkey)?.[1];
      
      if (!otherPubkey) {
        console.error('No recipient found in message');
        return null;
      }

      // Decrypt the content
      const decrypted = await user.signer.nip44.decrypt(
        event.pubkey === user.pubkey ? otherPubkey : event.pubkey,
        event.content
      );

      // Cache the result
      decryptionCache.set(event.id, decrypted);
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return null;
    }
  }, [user, decryptionCache, toast]);

  // Process DM event
  const processDMEvent = useCallback(async (event: NostrEvent) => {
    if (!user) return;

    // Get conversation pubkey (the other party)
    const pTags = event.tags.filter(tag => tag[0] === 'p');
    const otherPubkey = event.pubkey === user.pubkey 
      ? pTags.find(tag => tag[1] !== user.pubkey)?.[1]
      : event.pubkey;

    if (!otherPubkey) return;

    // Decrypt the message
    const decryptedContent = await decryptMessage(event);

    const message: DirectMessage = {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      decryptedContent: decryptedContent || undefined,
      createdAt: event.created_at,
      sent: event.pubkey === user.pubkey,
      encrypted: true,
      ephemeral: event.tags.some(tag => tag[0] === 'expiration'),
      expiresAt: event.tags.find(tag => tag[0] === 'expiration')?.[1] 
        ? parseInt(event.tags.find(tag => tag[0] === 'expiration')![1]) 
        : undefined,
    };

    setConversations(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(otherPubkey) || {
        pubkey: otherPubkey,
        messages: [],
        unreadCount: 0,
      };

      // Check if message already exists
      if (existing.messages.some(m => m.id === message.id)) {
        return prev;
      }

      // Add message and sort by timestamp
      existing.messages = [...existing.messages, message].sort((a, b) => a.createdAt - b.createdAt);
      existing.lastMessage = message;
      
      // Increment unread count if received
      if (!message.sent) {
        existing.unreadCount++;
      }

      newMap.set(otherPubkey, existing);
      return newMap;
    });
  }, [user, decryptMessage]);

  // Load DMs
  const loadDMs = useCallback(async () => {
    if (!user || !nostr) return;

    setIsLoading(true);

    try {
      const filters: NostrFilter[] = [
        // Sent messages
        { kinds: [4], authors: [user.pubkey], limit: 100 },
        // Received messages
        { kinds: [4], '#p': [user.pubkey], limit: 100 },
      ];

      const events = await nostr.query(filters, {
        signal: AbortSignal.timeout(5000),
      });

      // Process all events
      for (const event of events) {
        await processDMEvent(event);
      }

      // Store encrypted backup
      const backup = Array.from(conversations.entries());
      secureStorage.set('dm-backup', backup);
    } catch (error) {
      console.error('Failed to load DMs:', error);
      toast({
        title: 'Failed to load messages',
        description: 'Please check your connection and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, nostr, conversations, processDMEvent, toast]);

  // Send encrypted DM
  const sendDM = useCallback(async (
    recipientPubkey: string, 
    content: string,
    options?: {
      ephemeral?: boolean;
      expirationHours?: number;
    }
  ) => {
    if (!user?.signer.nip44) {
      toast({
        title: 'Cannot send encrypted message',
        description: 'Your signer does not support encryption',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Validate recipient pubkey
      let pubkey = recipientPubkey;
      if (recipientPubkey.startsWith('npub')) {
        const decoded = nip19.decode(recipientPubkey);
        if (decoded.type !== 'npub') {
          throw new Error('Invalid npub');
        }
        pubkey = decoded.data;
      }

      // Encrypt the content
      const encrypted = await user.signer.nip44.encrypt(pubkey, content);

      // Build tags
      const tags: string[][] = [['p', pubkey]];
      
      // Add expiration if ephemeral
      if (options?.ephemeral && options.expirationHours) {
        const expirationTime = Math.floor(Date.now() / 1000) + (options.expirationHours * 3600);
        tags.push(['expiration', expirationTime.toString()]);
      }

      // Create and publish event
      const event = await user.signer.signEvent({
        kind: 4,
        content: encrypted,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);

      // Add to local conversations
      await processDMEvent(event);

      toast({
        title: 'Message sent',
        description: options?.ephemeral 
          ? `Message will expire in ${options.expirationHours} hours`
          : 'Your encrypted message has been sent',
      });

      return event;
    } catch (error) {
      console.error('Failed to send DM:', error);
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, nostr, processDMEvent, toast]);

  // Mark conversation as read
  const markAsRead = useCallback((pubkey: string) => {
    setConversations(prev => {
      const newMap = new Map(prev);
      const conversation = newMap.get(pubkey);
      if (conversation) {
        conversation.unreadCount = 0;
        newMap.set(pubkey, conversation);
      }
      return newMap;
    });
  }, []);

  // Delete conversation (local only)
  const deleteConversation = useCallback((pubkey: string) => {
    setConversations(prev => {
      const newMap = new Map(prev);
      newMap.delete(pubkey);
      return newMap;
    });
  }, []);

  // Clean up expired messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      setConversations(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;

        newMap.forEach((conversation, pubkey) => {
          const activeMessages = conversation.messages.filter(msg => {
            if (msg.ephemeral && msg.expiresAt && msg.expiresAt <= now) {
              hasChanges = true;
              return false;
            }
            return true;
          });

          if (activeMessages.length !== conversation.messages.length) {
            conversation.messages = activeMessages;
            conversation.lastMessage = activeMessages[activeMessages.length - 1];
            newMap.set(pubkey, conversation);
          }
        });

        return hasChanges ? newMap : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Subscribe to new DMs
  useEffect(() => {
    if (!user || !nostr) return;

    const filters: NostrFilter[] = [
      { kinds: [4], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) },
    ];

    const abortController = new AbortController();

    const subscribe = async () => {
      try {
        const subscription = nostr.req(filters, {
          signal: abortController.signal,
        });

        for await (const msg of subscription) {
          if (msg[0] === 'EVENT') {
            processDMEvent(msg[2]);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('DM subscription error:', error);
        }
      }
    };

    subscribe();

    return () => {
      abortController.abort();
    };
  }, [user, nostr, processDMEvent]);

  // Load DMs on mount
  useEffect(() => {
    loadDMs();
  }, []);

  return {
    conversations: Array.from(conversations.values()),
    isLoading,
    sendDM,
    markAsRead,
    deleteConversation,
    refresh: loadDMs,
    totalUnread: Array.from(conversations.values()).reduce((sum, c) => sum + c.unreadCount, 0),
  };
}