import { useState, useEffect, useCallback } from 'react';
import { GitHubEventsService } from '@/services/githubEvents';
import { Event } from '@/types/events';

interface UseGitHubEventsResult {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGitHubEvents(limit: number = 3): UseGitHubEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventsService = GitHubEventsService.getInstance();

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all events
      const allEvents = await eventsService.fetchEventFiles();
      
      if (allEvents.length === 0) {
        setError('No events found');
        return;
      }

      // Get upcoming events sorted by date
      const upcomingEvents = eventsService.getUpcomingEvents(allEvents, limit);
      
      setEvents(limit === 100 ? allEvents : upcomingEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [limit, eventsService]);

  const refresh = useCallback(() => {
    eventsService.clearCache();
    loadEvents();
  }, [eventsService, loadEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    isLoading,
    error,
    refresh
  };
}