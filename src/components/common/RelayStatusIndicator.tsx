import { useRelayStatus } from '@/hooks/useRelayStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WifiIcon, WifiOffIcon, AlertCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RelayStatusIndicator({ className }: { className?: string }) {
  const { relayStatuses, overallStatus, connectedCount, totalCount } = useRelayStatus();

  const statusIcon = {
    connecting: <WifiIcon className="h-4 w-4 animate-pulse" />,
    connected: <WifiIcon className="h-4 w-4" />,
    disconnected: <WifiOffIcon className="h-4 w-4" />,
    error: <AlertCircleIcon className="h-4 w-4" />
  }[overallStatus];

  const statusColor = {
    connecting: 'text-yellow-600',
    connected: 'text-green-600',
    disconnected: 'text-orange-600',
    error: 'text-red-600'
  }[overallStatus];

  const statusText = {
    connecting: 'Connecting...',
    connected: `Connected (${connectedCount}/${totalCount})`,
    disconnected: 'Partially connected',
    error: 'Connection error'
  }[overallStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", statusColor, className)}
        >
          {statusIcon}
          <span className="text-xs">{statusText}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Relay Connections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Array.from(relayStatuses.values()).map((relay) => (
          <DropdownMenuItem key={relay.url} className="flex items-center justify-between">
            <span className="text-xs truncate max-w-[140px]">
              {relay.url.replace('wss://', '').replace('/', '')}
            </span>
            <div className="flex items-center gap-2">
              {relay.latency && (
                <span className="text-xs text-muted-foreground">
                  {relay.latency}ms
                </span>
              )}
              <Badge
                variant={
                  relay.status === 'connected' ? 'default' :
                  relay.status === 'connecting' ? 'secondary' :
                  'destructive'
                }
                className="text-xs px-1 py-0"
              >
                {relay.status}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}