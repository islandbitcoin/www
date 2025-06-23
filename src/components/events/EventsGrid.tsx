import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, Zap, ExternalLink, Eye } from 'lucide-react';
import { GitHubEventsService } from '@/services/githubEvents';
import { EventWithDate } from '@/types/events';
import { cn } from '@/lib/utils';

interface EventsGridProps {
  events: EventWithDate[];
  onEventClick: (event: EventWithDate) => void;
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

export function EventsGrid({ events, onEventClick }: EventsGridProps) {
  const eventsService = GitHubEventsService.getInstance();

  if (events.length === 0) {
    return (
      <Card className="border-dashed border-2 border-caribbean-sand">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-caribbean-ocean/50 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for upcoming Bitcoin events
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((item) => {
        const event = item.event.event;
        const location = event.location;
        const locationString = location?.address 
          ? `${location.address.city}, ${location.address.country}`
          : location?.name || 'Location TBD';
        const isPastEvent = !item.nextDate;
        
        return (
          <Card 
            key={event.id} 
            className={cn(
              "transition-all hover:shadow-lg border-caribbean-sand hover:border-caribbean-ocean/30 flex flex-col h-full",
              isPastEvent && "opacity-60 hover:opacity-80"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-caribbean-ocean line-clamp-2">
                    {event.basic_info.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3" />
                    {locationString}
                  </CardDescription>
                </div>
                {isPastEvent && (
                  <Badge variant="secondary" className="ml-2">
                    Past
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {event.basic_info.summary || event.basic_info.description}
              </p>
              
              {/* Date display */}
              <div className="flex items-center gap-2 text-sm text-caribbean-palm mb-3">
                <Clock className="h-3 w-3" />
                <span>
                  {item.nextDate 
                    ? eventsService.formatEventDate(item.event)
                    : eventsService.getEventDate(item.event)?.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) || 'Date TBD'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <EventIcon type={event.basic_info.type} />
                  <span className="capitalize">{event.basic_info.type}</span>
                </div>
                
                <div className="flex gap-2">
                  {event.registration?.fee?.amount === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  )}
                  {event.datetime.recurring?.enabled && !isPastEvent && (
                    <Badge variant="secondary" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              {event.basic_info.tags && event.basic_info.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {event.basic_info.tags.slice(0, 3).map((tag: string) => (
                    <span 
                      key={tag} 
                      className="text-xs bg-caribbean-sand/50 text-caribbean-ocean px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {event.basic_info.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{event.basic_info.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="mt-auto pt-4 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(item);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
                {event.registration?.url && !isPastEvent && (
                  <a 
                    href={event.registration.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button 
                      size="sm" 
                      className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
                    >
                      Register
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}