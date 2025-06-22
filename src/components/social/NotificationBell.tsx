import { useState } from 'react';
import { Bell, BellOff, MessageCircle, Heart, Repeat2, Zap, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: ReturnType<typeof useNotifications>['notifications'][0];
  onRead: (id: string) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const author = useAuthor(notification.event.pubkey);
  const displayName = author.data?.metadata?.name || genUserName(notification.event.pubkey);
  
  const icon = {
    mention: <MessageCircle className="h-4 w-4 text-caribbean-ocean" />,
    reply: <MessageCircle className="h-4 w-4 text-caribbean-ocean" />,
    like: <Heart className="h-4 w-4 text-caribbean-hibiscus" />,
    repost: <Repeat2 className="h-4 w-4 text-caribbean-palm" />,
    zap: <Zap className="h-4 w-4 text-caribbean-mango" />,
  }[notification.type];

  const message = {
    mention: 'mentioned you',
    reply: 'replied to your post',
    like: 'liked your post',
    repost: 'reposted your content',
    zap: 'zapped you',
  }[notification.type];

  return (
    <DropdownMenuItem
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer',
        !notification.read && 'bg-caribbean-sand/20'
      )}
      onClick={() => onRead(notification.id)}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{displayName}</span>{' '}
          <span className="text-muted-foreground">{message}</span>
        </p>
        {notification.type === 'mention' || notification.type === 'reply' ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.event.content}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-caribbean-ocean rounded-full mt-2" />
      )}
    </DropdownMenuItem>
  );
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    hasPermission,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleNotifications,
    requestPermission,
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleNotifications = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (granted) {
        toggleNotifications();
      }
    } else {
      toggleNotifications();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                handleToggleNotifications();
              }}
            >
              {hasPermission ? (
                <BellOff className="h-3 w-3" />
              ) : (
                <Bell className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {!hasPermission && (
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={requestPermission}
            >
              Enable Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}