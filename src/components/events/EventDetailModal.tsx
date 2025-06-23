import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, DollarSign, Mail, Phone, Globe, ExternalLink, User, Utensils, Car, Bus } from 'lucide-react';
import { EventWithDate } from '@/types/events';
import { GitHubEventsService } from '@/services/githubEvents';

interface EventDetailModalProps {
  event: EventWithDate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const eventsService = GitHubEventsService.getInstance();
  const eventData = event.event.event;
  const location = eventData.location;
  const isPastEvent = !event.nextDate;

  const locationString = location?.address 
    ? `${location.address.street ? location.address.street + ', ' : ''}${location.address.city}, ${location.address.country}`
    : location?.name || 'Location TBD';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-caribbean-ocean pr-4">
                {eventData.basic_info.title}
              </DialogTitle>
              {eventData.basic_info.subtitle && (
                <DialogDescription className="text-base mt-1">
                  {eventData.basic_info.subtitle}
                </DialogDescription>
              )}
            </div>
            {isPastEvent && (
              <Badge variant="secondary">Past Event</Badge>
            )}
          </div>
        </DialogHeader>

        {/* Prominent Register button */}
        {eventData.registration?.url && !isPastEvent && (
          <div className="mt-4">
            <a 
              href={eventData.registration.url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90 h-12 text-base gap-2">
                Register for This Event
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-caribbean-ocean mt-0.5" />
            <div>
              <p className="font-semibold">
                {event.nextDate 
                  ? eventsService.formatEventDate(event.event)
                  : eventsService.getEventDate(event.event)?.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) || 'Date TBD'
                }
              </p>
              {eventData.datetime.start !== 'TBD' && (
                <p className="text-sm text-gray-600">
                  {new Date(eventData.datetime.start).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })} - {new Date(eventData.datetime.end).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {eventData.datetime.recurring?.enabled && (
                <p className="text-sm text-caribbean-palm mt-1">
                  Recurring {eventData.datetime.recurring.frequency}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-caribbean-ocean mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{location.name || 'Location TBD'}</p>
                <p className="text-sm text-gray-600">{locationString}</p>
                {location.directions && (
                  <p className="text-sm text-gray-600 mt-1">{location.directions}</p>
                )}
                {(location.parking || location.public_transit) && (
                <div className="flex gap-4 mt-2">
                  {location.parking && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Car className="h-3 w-3" />
                      <span>{location.parking}</span>
                    </div>
                  )}
                  {location.public_transit && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Bus className="h-3 w-3" />
                      <span>{location.public_transit}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Tabs for detailed information */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {eventData.basic_info.description}
                </p>
              </div>

              {/* Tags and Categories */}
              <div>
                <h3 className="font-semibold mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {eventData.basic_info.type}
                  </Badge>
                  {eventData.basic_info.categories?.map((cat: string) => (
                    <Badge key={cat} variant="secondary" className="capitalize">
                      {cat}
                    </Badge>
                  ))}
                  {eventData.basic_info.tags?.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="text-sm bg-caribbean-sand/50 text-caribbean-ocean px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              {eventData.target_audience && (
                <div>
                  <h3 className="font-semibold mb-2">Who should attend</h3>
                  <div className="flex flex-wrap gap-2">
                    {eventData.target_audience.experience_level?.map((level: string) => (
                      <Badge key={level} variant="outline" className="capitalize">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              {eventData.datetime.schedule && eventData.datetime.schedule.length > 0 ? (
                <div className="space-y-3">
                  {eventData.datetime.schedule.map((item: { title: string; time: string; duration: string; description?: string }, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {item.time} • {item.duration}
                          </Badge>
                        </div>
                      </CardHeader>
                      {item.description && (
                        <CardContent>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Schedule details coming soon
                </p>
              )}
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 mt-4">
              {/* Registration Info */}
              <div>
                <h3 className="font-semibold mb-2">Registration</h3>
                <p className="text-gray-600">
                  {eventData.registration?.required 
                    ? 'Registration is required for this event'
                    : 'No registration required - just show up!'
                  }
                </p>
              </div>

              {/* Pricing */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-caribbean-ocean mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {eventData.registration?.fee?.amount === 0 
                      ? 'Free Event' 
                      : `${eventData.registration?.fee?.amount} ${eventData.registration?.fee?.currency}`
                    }
                  </p>
                  {eventData.registration?.fee?.bitcoin_accepted && (
                    <p className="text-sm text-caribbean-palm">
                      ₿ Bitcoin accepted
                      {eventData.registration?.fee?.lightning_accepted && ' (including Lightning)'}
                    </p>
                  )}
                </div>
              </div>

              {/* Capacity */}
              {eventData.registration?.capacity && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-caribbean-ocean mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Capacity: {eventData.registration.capacity.max} people
                    </p>
                    {eventData.registration.capacity.current > 0 && (
                      <p className="text-sm text-gray-600">
                        {eventData.registration.capacity.current} registered
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {eventData.registration?.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {eventData.registration.requirements.age_minimum && (
                      <li>• Minimum age: {eventData.registration.requirements.age_minimum}</li>
                    )}
                    {eventData.registration.requirements.bring_items?.map((item: string) => (
                      <li key={item}>• Bring: {item}</li>
                    ))}
                    {eventData.registration.requirements.preparation && (
                      <li>• {eventData.registration.requirements.preparation}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Registration Link */}
              {eventData.registration?.url && (
                <div className="pt-4">
                  <a 
                    href={eventData.registration.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90">
                      Register for Event
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Organizer */}
              <div>
                <h3 className="font-semibold mb-2">Organized by</h3>
                <Card>
                  <CardContent className="pt-4">
                    <p className="font-medium">{eventData.organizer.name}</p>
                    <div className="space-y-1 mt-2">
                      {eventData.organizer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${eventData.organizer.email}`} className="hover:underline">
                            {eventData.organizer.email}
                          </a>
                        </div>
                      )}
                      {eventData.organizer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${eventData.organizer.phone}`} className="hover:underline">
                            {eventData.organizer.phone}
                          </a>
                        </div>
                      )}
                      {eventData.organizer.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="h-3 w-3" />
                          <a 
                            href={eventData.organizer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Speakers */}
              {eventData.speakers && eventData.speakers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Speakers</h3>
                  <div className="space-y-2">
                    {eventData.speakers.map((speaker: { name: string; title?: string; bio?: string; topics?: string[] }, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-caribbean-ocean mt-0.5" />
                            <div>
                              <p className="font-medium">{speaker.name}</p>
                              {speaker.title && (
                                <p className="text-sm text-gray-600">{speaker.title}</p>
                              )}
                              {speaker.bio && (
                                <p className="text-sm text-gray-600 mt-1">{speaker.bio}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Catering */}
              {eventData.catering?.provided && (
                <div>
                  <h3 className="font-semibold mb-2">Food & Drinks</h3>
                  <div className="flex items-start gap-3">
                    <Utensils className="h-5 w-5 text-caribbean-ocean mt-0.5" />
                    <div>
                      <p className="text-gray-600">
                        {eventData.catering.type === 'meal' ? 'Full meal' : 'Refreshments'} provided
                      </p>
                      {eventData.catering.dietary_options && (
                        <p className="text-sm text-gray-600">
                          Dietary options: {eventData.catering.dietary_options.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Accessibility */}
              {eventData.basic_info.accessibility && (
                <div>
                  <h3 className="font-semibold mb-2">Accessibility</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {eventData.basic_info.accessibility.wheelchair_accessible && (
                      <li>• Wheelchair accessible</li>
                    )}
                    {eventData.basic_info.accessibility.sign_language && (
                      <li>• Sign language interpretation</li>
                    )}
                    {eventData.basic_info.accessibility.live_captions && (
                      <li>• Live captions available</li>
                    )}
                    {eventData.basic_info.accessibility.other_accommodations?.map((item: string) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}