import { useState, useEffect, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { getUserPreferences, setUserPreferences } from '@/lib/secureStorage';

interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'like' | 'repost' | 'zap';
  event: NostrEvent;
  read: boolean;
  timestamp: number;
}

// Notification sound URLs (using base64 encoded sounds)
const NOTIFICATION_SOUNDS = {
  default: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAIlYAAIhYAQACABAAZGF0YVYGAAD/////...',
  mention: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAIlYAAIhYAQACABAAZGF0YVYGAAD/////...',
};

export function useNotifications() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Play notification sound
  const playSound = useCallback((type: string = 'default') => {
    const preferences = getUserPreferences();
    if (!preferences.notificationsEnabled) return;

    try {
      const audio = new Audio(NOTIFICATION_SOUNDS[type as keyof typeof NOTIFICATION_SOUNDS] || NOTIFICATION_SOUNDS.default);
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!hasPermission || !getUserPreferences().notificationsEnabled) return;

    const { type, event } = notification;
    let title = '';
    let body = '';
    const _icon = '🏝️';

    switch (type) {
      case 'mention':
        title = '💬 New Mention';
        body = event.content.slice(0, 100);
        break;
      case 'reply':
        title = '💭 New Reply';
        body = event.content.slice(0, 100);
        break;
      case 'like':
        title = '❤️ New Like';
        body = 'Someone liked your post';
        break;
      case 'repost':
        title = '🔁 New Repost';
        body = 'Someone reposted your content';
        break;
      case 'zap':
        title = '⚡ New Zap';
        body = 'You received a zap!';
        break;
    }

    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [hasPermission]);

  // Process incoming event
  const processEvent = useCallback((event: NostrEvent) => {
    if (!user) return;

    let type: Notification['type'] | null = null;
    
    // Check event type
    if (event.kind === 1) {
      // Check for mentions
      const pTags = event.tags.filter(tag => tag[0] === 'p');
      if (pTags.some(tag => tag[1] === user.pubkey)) {
        type = 'mention';
      }
      
      // Check for replies
      const eTags = event.tags.filter(tag => tag[0] === 'e');
      if (eTags.length > 0 && !type) {
        type = 'reply';
      }
    } else if (event.kind === 7) {
      type = 'like';
    } else if ([6, 16].includes(event.kind)) {
      type = 'repost';
    } else if (event.kind === 9735) {
      type = 'zap';
    }

    if (type) {
      const notification: Notification = {
        id: event.id,
        type,
        event,
        read: false,
        timestamp: event.created_at * 1000,
      };

      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 100); // Keep last 100
      });

      // Show toast
      toast({
        title: 'New notification',
        description: `You have a new ${type}`,
      });

      // Play sound and show browser notification
      playSound(type);
      showBrowserNotification(notification);
    }
  }, [user, toast, playSound, showBrowserNotification]);

  // Start listening for notifications
  useEffect(() => {
    if (!user || !nostr || isListening) return;

    const filters: NostrFilter[] = [
      // Mentions and replies
      { kinds: [1], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) },
      // Reactions to user's posts
      { kinds: [7], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) },
      // Reposts
      { kinds: [6, 16], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) },
      // Zaps
      { kinds: [9735], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) },
    ];

    const abortController = new AbortController();
    
    const startListening = async () => {
      setIsListening(true);
      
      try {
        const subscription = nostr.req(filters, {
          signal: abortController.signal,
        });

        for await (const msg of subscription) {
          if (msg[0] === 'EVENT') {
            processEvent(msg[2]);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error listening for notifications:', error);
        }
      } finally {
        setIsListening(false);
      }
    };

    startListening();

    return () => {
      abortController.abort();
    };
  }, [user, nostr, isListening, processEvent]);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Toggle notifications enabled
  const toggleNotifications = useCallback(async () => {
    const preferences = getUserPreferences();
    const newValue = !preferences.notificationsEnabled;
    
    if (newValue && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setUserPreferences({ notificationsEnabled: newValue });
    
    toast({
      title: newValue ? 'Notifications enabled' : 'Notifications disabled',
    });
  }, [hasPermission, requestPermission, toast]);

  return {
    notifications,
    unreadCount,
    isListening,
    hasPermission,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleNotifications,
    requestPermission,
  };
}