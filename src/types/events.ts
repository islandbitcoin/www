export interface Event {
  event: {
    id: string;
    status: string;
    basic_info: {
      title: string;
      subtitle?: string;
      description: string;
      summary: string;
      type: string;
      tags?: string[];
      categories?: string[];
      accessibility?: {
        wheelchair_accessible?: boolean;
        sign_language?: boolean;
        live_captions?: boolean;
        other_accommodations?: string[];
      };
    };
    datetime: {
      start: string;
      end: string;
      recurring?: {
        enabled: boolean;
        frequency?: string;
        end_date?: string;
        exceptions?: string[];
      };
      doors_open?: string;
      schedule?: Array<{
        time: string;
        duration: string;
        title: string;
        description?: string;
      }>;
    };
    location: {
      type: string;
      name: string;
      address?: {
        street?: string;
        city: string;
        state_province?: string;
        postal_code?: string;
        country: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
      directions?: string;
      parking?: string;
      public_transit?: string;
    };
    registration?: {
      required?: boolean;
      url?: string;
      email?: string;
      capacity?: {
        max: number;
        current: number;
        waitlist?: boolean;
      };
      fee?: {
        amount: number;
        currency: string;
        bitcoin_accepted?: boolean;
        lightning_accepted?: boolean;
        lightning_address?: string;
      };
      requirements?: {
        age_minimum?: number;
        prerequisites?: string[];
        bring_items?: string[];
        preparation?: string;
      };
    };
    organizer: {
      name: string;
      email?: string;
      phone?: string;
      website?: string;
      nostr?: {
        npub?: string;
        nip05?: string;
      };
      social?: {
        twitter?: string;
        telegram?: string;
      };
    };
    speakers?: Array<{
      name: string;
      title?: string;
      bio?: string;
      topics?: string[];
    }>;
    sponsors?: Array<{
      name: string;
      tier?: string;
      description?: string;
    }>;
    media?: {
      featured_image?: string;
      thumbnail?: string;
      gallery?: string[];
    };
    catering?: {
      provided?: boolean;
      type?: string;
      dietary_options?: string[];
      bitcoin_merchants?: Array<{
        name: string;
        accepts_lightning?: boolean;
      }>;
    };
    extras?: {
      giveaways?: string[];
      activities?: string[];
      networking_session?: boolean;
    };
    target_audience?: {
      experience_level?: string[];
      interests?: string[];
      age_groups?: string[];
    };
    promotion?: {
      hashtags?: string[];
      marketing_materials?: {
        flyer?: string;
      };
    };
    metrics?: {
      expected_attendance?: number;
      success_metrics?: string[];
    };
    metadata?: {
      created_at?: string;
      updated_at?: string;
      submitted_by?: string;
      approved?: boolean;
      version?: number;
    };
  };
}

export interface EventWithDate {
  event: Event;
  nextDate: Date | null;
}