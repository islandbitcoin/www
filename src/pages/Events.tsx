import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import { EventsGrid } from "@/components/events/EventsGrid";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { useGitHubEvents } from "@/hooks/useGitHubEvents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GitHubEventsService } from "@/services/githubEvents";
import { EventWithDate } from "@/types/events";
import { Link } from "react-router-dom";

export type { EventWithDate };

const Events = () => {
  useSeoMeta({
    title: `Events - ${siteConfig.name}`,
    description: "Bitcoin meetups, workshops, and celebrations across the Caribbean islands",
  });

  const { events: allEvents, isLoading, error, refresh } = useGitHubEvents(100); // Get all events
  const [selectedEvent, setSelectedEvent] = useState<EventWithDate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const eventsService = GitHubEventsService.getInstance();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Process events with dates
  const processedEvents: EventWithDate[] = allEvents.map(event => ({
    event,
    nextDate: eventsService.getNextOccurrence(event)
  }));

  // Filter events based on selection
  const filteredEvents = processedEvents.filter(item => {
    if (filter === "upcoming") return item.nextDate !== null;
    if (filter === "past") return item.nextDate === null && eventsService.getEventDate(item.event) !== null;
    return true; // "all"
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // If both have nextDate, sort by nextDate
    if (a.nextDate && b.nextDate) {
      return a.nextDate.getTime() - b.nextDate.getTime();
    }
    // If only a has nextDate, a comes first
    if (a.nextDate && !b.nextDate) return -1;
    // If only b has nextDate, b comes first
    if (!a.nextDate && b.nextDate) return 1;
    // If neither has nextDate, sort by original event date (most recent first)
    const aDate = eventsService.getEventDate(a.event);
    const bDate = eventsService.getEventDate(b.event);
    if (aDate && bDate) return bDate.getTime() - aDate.getTime();
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-caribbean-ocean via-caribbean-turquoise to-caribbean-palm bg-clip-text text-transparent">
            Bitcoin Events
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Join the Caribbean Bitcoin community at meetups, workshops, and celebrations
          </p>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Button 
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All Events
            </Button>
            <Button 
              variant={filter === "upcoming" ? "default" : "outline"}
              onClick={() => setFilter("upcoming")}
              size="sm"
            >
              Upcoming
            </Button>
            <Button 
              variant={filter === "past" ? "default" : "outline"}
              onClick={() => setFilter("past")}
              size="sm"
            >
              Past Events
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="ghost" 
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Calendar className="h-12 w-12 text-caribbean-ocean/50 animate-pulse" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-dashed border-2 border-caribbean-sand max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-caribbean-ocean/50 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Unable to load events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please try again later
              </p>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events grid */}
        {!isLoading && !error && (
          <>
            <EventsGrid 
              events={sortedEvents} 
              onEventClick={setSelectedEvent}
            />
            
            {/* Submit event CTA */}
            <div className="text-center mt-12">
              <a
                href={`https://github.com/islandbitcoin/islandbitcoin-community/issues/new?title=Event%20Submission:%20[Your%20Event%20Name]&body=${encodeURIComponent(`## Event Submission Template

**Event Name:** [Your Event Name]

**Country, Location:** [City, Country]

**Date and Time:** [Date]

**Description:** 
[Describe your event]

**Event Type:** 
- [ ] One-time event
- [ ] Recurring event
- [ ] Workshop
- [ ] Conference
- [ ] Meetup
- [ ] Other: ___________

**Registration/RSVP Link:** [If applicable]

**Contact Information:**
- Organizer Name: 
- Nostr npub: 
- Email/Other: 

---
*Please fill out all applicable fields above and submit this issue. We'll review and add your event to Island Bitcoin!*`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                  Submit an Event
                </Button>
              </a>
            </div>
          </>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Events;