import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Zap, MapPin, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { GitHubEventsService } from '@/services/githubEvents';
import { cn } from '@/lib/utils';

interface UpcomingEventsProps {
  className?: string;
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'meetup':
    case 'social':
      return <Users className="h-4 w-4" />;
    case 'workshop':
      return <Calendar className="h-4 w-4" />;
    case 'conference':
    case 'special':
    default:
      return <Zap className="h-4 w-4" />;
  }
}

function EventTypeLabel({ type }: { type: string }) {
  switch (type) {
    case 'meetup':
      return 'Social Meetup';
    case 'workshop':
      return 'Workshop';
    case 'conference':
      return 'Conference';
    case 'social':
      return 'Special Event';
    case 'online':
      return 'Online Event';
    case 'hybrid':
      return 'Hybrid Event';
    default:
      return 'Event';
  }
}

export function UpcomingEvents({ className }: UpcomingEventsProps) {
  const { events, isLoading, error, refresh } = useGitHubEvents(3);
  const eventsService = GitHubEventsService.getInstance();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${className || ''}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow border-caribbean-sand">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/3 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error || events.length === 0) {
    return (
      <Card className="border-dashed border-2 border-caribbean-sand">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <AlertCircle className="h-12 w-12 text-caribbean-ocean/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Events Loading...</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check back soon for upcoming Bitcoin events
          </p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleRefresh} 
          variant="ghost" 
          size="sm"
          className="gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Events
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {events.map((eventData) => {
        const event = eventData.event;
        const location = event.location;
        const locationString = location?.address 
          ? `${location.address.city}, ${location.address.country}`
          : location?.name || 'Location TBD';
        
        // Check if this is a past event
        const nextDate = eventsService.getNextOccurrence(eventData);
        const eventDate = eventsService.getEventDate(eventData);
        const isPastEvent = !nextDate && eventDate && eventDate < new Date();
        
        return (
          <Card 
            key={event.id} 
            className={cn(
              "hover:shadow-lg transition-shadow border-caribbean-sand hover:border-caribbean-ocean/30",
              isPastEvent && "opacity-75"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-caribbean-ocean">
                    {event.basic_info.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3" />
                    {locationString} • {eventsService.formatEventDate(eventData)}
                  </CardDescription>
                </div>
                {isPastEvent && (
                  <Badge variant="secondary" className="ml-2">
                    Past
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-3">
                {event.basic_info.summary || event.basic_info.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-caribbean-palm">
                  <EventIcon type={event.basic_info.type} />
                  <span><EventTypeLabel type={event.basic_info.type} /></span>
                </div>
                {event.registration?.fee?.amount === 0 && (
                  <span className="text-xs bg-caribbean-ocean/10 text-caribbean-ocean px-2 py-1 rounded">
                    Free
                  </span>
                )}
              </div>
              {event.basic_info.tags?.includes('beginner-friendly') && (
                <div className="mt-2">
                  <span className="text-xs bg-caribbean-palm/10 text-caribbean-palm px-2 py-1 rounded">
                    Beginner Friendly
                  </span>
                </div>
              )}
              
              {/* Register button */}
              {event.registration?.url && !isPastEvent && (
                <div className="mt-4 pt-4 border-t border-caribbean-sand">
                  <a 
                    href={event.registration.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      size="sm" 
                      className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90 gap-2"
                    >
                      Register Now
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}