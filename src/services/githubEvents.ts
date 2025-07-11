import { Event } from '@/types/events';

interface EventFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
}

interface EventsCache {
  events: Event[];
  timestamp: number;
}

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'islandbitcoin';
const REPO_NAME = 'islandbitcoin-community';
const EVENTS_PATH = 'events';
const CACHE_KEY = 'islandbitcoin:github-events';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export class GitHubEventsService {
  private static instance: GitHubEventsService;
  
  static getInstance(): GitHubEventsService {
    if (!GitHubEventsService.instance) {
      GitHubEventsService.instance = new GitHubEventsService();
    }
    return GitHubEventsService.instance;
  }

  private loadCache(): EventsCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as EventsCache;
      
      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_TTL) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load events cache:', error);
      return null;
    }
  }

  private saveCache(events: Event[]): void {
    try {
      const cache: EventsCache = {
        events,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save events cache:', error);
    }
  }

  async fetchEventFiles(): Promise<Event[]> {
    // Check cache first
    const cached = this.loadCache();
    if (cached) {
      return cached.events;
    }

    try {
      // Fetch list of files from GitHub API
      const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${EVENTS_PATH}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const files = await response.json() as EventFile[];
      
      // Filter for JSON files only, excluding templates
      const jsonFiles = files.filter(file => 
        file.type === 'file' && 
        file.name.endsWith('.json') &&
        !file.name.includes('template')
      );

      // Fetch content of each JSON file
      const eventPromises = jsonFiles.map(async (file) => {
        try {
          const contentResponse = await fetch(file.download_url);
          if (!contentResponse.ok) {
            throw new Error(`Failed to fetch ${file.name}`);
          }
          const eventData = await contentResponse.json() as Event;
          return eventData;
        } catch (error) {
          console.error(`Failed to parse event file ${file.name}:`, error);
          return null;
        }
      });

      const events = (await Promise.all(eventPromises)).filter((event): event is Event => event !== null);
      
      // Cache the results
      this.saveCache(events);
      
      return events;
    } catch (error) {
      console.error('Failed to fetch event files:', error);
      return [];
    }
  }

  getEventDate(event: Event): Date | null {
    const datetime = event.event.datetime;
    if (!datetime || !datetime.start) return null;

    // Handle different date formats
    if (datetime.start === 'TBD') return null;
    
    try {
      // If it's just a date (YYYY-MM-DD), add time
      if (datetime.start.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(datetime.start + 'T00:00:00');
      }
      
      // Otherwise parse as full datetime
      return new Date(datetime.start);
    } catch {
      console.error('Failed to parse date:', datetime.start);
      return null;
    }
  }

  getNextOccurrence(event: Event): Date | null {
    const eventDate = this.getEventDate(event);
    if (!eventDate) return null;

    const datetime = event.event.datetime;
    const now = new Date();

    // Non-recurring event
    if (!datetime.recurring?.enabled) {
      return eventDate > now ? eventDate : null;
    }

    // Recurring event - calculate next occurrence
    const recurring = datetime.recurring;
    
    // Check if recurring has ended
    if (recurring.end_date && new Date(recurring.end_date) < now) {
      return null;
    }

    // For recurring events, find the next occurrence
    const nextDate = new Date(eventDate);
    
    while (nextDate <= now) {
      switch (recurring.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly': {
          // For monthly events, preserve the "last X of month" pattern
          const currentDay = nextDate.getDate();
          nextDate.setMonth(nextDate.getMonth() + 1);
          // If the day changed (e.g., Jan 31 -> Feb 28), it was the last day of month
          if (nextDate.getDate() !== currentDay) {
            // Set to last day of the new month
            nextDate.setDate(0);
            nextDate.setMonth(nextDate.getMonth() + 2);
          }
          break;
        }
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          // If frequency is not specified, treat as non-recurring
          return eventDate > now ? eventDate : null;
      }
    }

    // Check if next occurrence is within the recurring end date
    if (recurring.end_date && nextDate > new Date(recurring.end_date)) {
      return null;
    }

    return nextDate;
  }

  getUpcomingEvents(events: Event[], limit: number = 3): Event[] {
    // Filter and sort events
    const eventsWithDates = events
      .filter(event => {
        // Validate event has required fields
        if (!event.event || !event.event.id || !event.event.status) {
          return false;
        }
        
        // Only show published events
        const validStatuses = ['published', 'draft', 'cancelled', 'postponed'];
        if (!validStatuses.includes(event.event.status)) {
          return false;
        }
        
        if (event.event.status !== 'published') {
          return false;
        }
        
        return true;
      })
      .map(event => {
        // Get next occurrence for recurring events, or original date for past events
        const nextDate = this.getNextOccurrence(event);
        const eventDate = this.getEventDate(event);
        const displayDate = nextDate || eventDate;
        
        // displayDate will be used for sorting
        
        return {
          event,
          nextDate: displayDate
        };
      })
      .filter(item => item.nextDate !== null);
    
    // Sort by date (closest to now first, whether past or future)
    const now = new Date();
    const sorted = eventsWithDates
      .sort((a, b) => {
        const aDiff = Math.abs(a.nextDate!.getTime() - now.getTime());
        const bDiff = Math.abs(b.nextDate!.getTime() - now.getTime());
        return aDiff - bDiff;
      })
      .slice(0, limit)
      .map(item => item.event);

    return sorted;
  }

  formatEventDate(event: Event): string {
    const nextDate = this.getNextOccurrence(event);
    const eventDate = this.getEventDate(event);
    const displayDate = nextDate || eventDate;
    
    if (!displayDate) return 'TBD';

    const datetime = event.event.datetime;
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };

    // For recurring events with future dates, show the pattern
    if (datetime.recurring?.enabled && nextDate) {
      const dateStr = nextDate.toLocaleDateString('en-US', options);
      switch (datetime.recurring.frequency) {
        case 'weekly':
          return `Every ${nextDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
        case 'monthly':
          return `Every Last ${nextDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
        case 'yearly':
          return dateStr;
        default:
          return dateStr;
      }
    }

    return displayDate.toLocaleDateString('en-US', options);
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}