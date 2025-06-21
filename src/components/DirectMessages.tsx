import { useState } from 'react';
import { MessageCircle, Lock, Send, Timer, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEncryptedDMs } from '@/hooks/useEncryptedDMs';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  onSelectConversation: (pubkey: string) => void;
  selectedPubkey?: string;
}

function ConversationList({ onSelectConversation, selectedPubkey }: ConversationListProps) {
  const { conversations, totalUnread } = useEncryptedDMs();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-caribbean-sand">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
          {totalUnread > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalUnread}
            </Badge>
          )}
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Send an encrypted message to start</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.pubkey}
                conversation={conv}
                isSelected={conv.pubkey === selectedPubkey}
                onClick={() => onSelectConversation(conv.pubkey)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ReturnType<typeof useEncryptedDMs>['conversations'][0];
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const author = useAuthor(conversation.pubkey);
  const displayName = author.data?.metadata?.name || genUserName(conversation.pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left',
        isSelected 
          ? 'bg-caribbean-ocean/10 border border-caribbean-ocean/20' 
          : 'hover:bg-caribbean-sand/20'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="bg-caribbean-ocean/10 text-caribbean-ocean">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm truncate">{displayName}</span>
          {conversation.lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(conversation.lastMessage.createdAt * 1000, { addSuffix: true })}
            </span>
          )}
        </div>
        
        {conversation.lastMessage && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessage.sent && <span className="text-caribbean-ocean">You: </span>}
            {conversation.lastMessage.decryptedContent || 
             <span className="italic">Encrypted message</span>}
          </p>
        )}
      </div>
      
      {conversation.unreadCount > 0 && (
        <Badge variant="destructive" className="ml-1">
          {conversation.unreadCount}
        </Badge>
      )}
    </button>
  );
}

interface ChatViewProps {
  pubkey: string;
  onBack: () => void;
}

function ChatView({ pubkey, onBack }: ChatViewProps) {
  const { conversations, sendDM, markAsRead, deleteConversation } = useEncryptedDMs();
  const author = useAuthor(pubkey);
  const [message, setMessage] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const conversation = conversations.find(c => c.pubkey === pubkey);
  const displayName = author.data?.metadata?.name || genUserName(pubkey);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    await sendDM(pubkey, message.trim(), {
      ephemeral: isEphemeral,
      expirationHours: 24,
    });
    setMessage('');
    setIsSending(false);
  };

  // Mark as read when viewing
  useState(() => {
    if (conversation) {
      markAsRead(pubkey);
    }
    return null;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-caribbean-sand flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="sm:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src={author.data?.metadata?.picture} alt={displayName} />
          <AvatarFallback className="bg-caribbean-ocean/10 text-caribbean-ocean text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{displayName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            End-to-end encrypted
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteConversation(pubkey)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {!conversation || conversation.messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-caribbean-sand space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            id="ephemeral"
            checked={isEphemeral}
            onCheckedChange={setIsEphemeral}
          />
          <Label htmlFor="ephemeral" className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Ephemeral (24h)
          </Label>
        </div>
        
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your encrypted message..."
            className="min-h-[60px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="bg-caribbean-ocean hover:bg-caribbean-ocean/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ReturnType<typeof useEncryptedDMs>['conversations'][0]['messages'][0];
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { sent, decryptedContent, createdAt, ephemeral, expiresAt } = message;
  
  const timeLeft = ephemeral && expiresAt 
    ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
    : null;

  return (
    <div className={cn('flex', sent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3 py-2',
          sent 
            ? 'bg-caribbean-ocean text-white' 
            : 'bg-caribbean-sand/30'
        )}
      >
        {decryptedContent ? (
          <p className="text-sm whitespace-pre-wrap break-words">{decryptedContent}</p>
        ) : (
          <p className="text-sm italic opacity-70">Unable to decrypt</p>
        )}
        
        <div className={cn(
          'text-xs mt-1 flex items-center gap-2',
          sent ? 'text-white/70' : 'text-muted-foreground'
        )}>
          <span>{formatDistanceToNow(createdAt * 1000, { addSuffix: true })}</span>
          
          {ephemeral && timeLeft !== null && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {timeLeft > 3600 
                ? `${Math.floor(timeLeft / 3600)}h` 
                : `${Math.floor(timeLeft / 60)}m`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DirectMessages() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPubkey, setSelectedPubkey] = useState<string | undefined>();
  const { totalUnread } = useEncryptedDMs();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalUnread}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={cn(
            'w-full sm:w-80 border-r border-caribbean-sand',
            selectedPubkey && 'hidden sm:block'
          )}>
            <ConversationList
              onSelectConversation={setSelectedPubkey}
              selectedPubkey={selectedPubkey}
            />
          </div>
          
          {/* Chat View */}
          <div className={cn(
            'flex-1',
            !selectedPubkey && 'hidden sm:flex'
          )}>
            {selectedPubkey ? (
              <ChatView 
                pubkey={selectedPubkey} 
                onBack={() => setSelectedPubkey(undefined)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Lock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}