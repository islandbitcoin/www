/**
 * Site configuration for easy customization and replication
 * Modify these values to customize the site for your community
 */

export interface SiteConfig {
  // Basic Information
  name: string;
  tagline: string;
  description: string;
  url: string;

  // Branding
  logo?: string;
  favicon?: string;
  themeColor: string;
  accentColor: string;

  // Community Settings
  community: {
    location: string;
    currency: string;
    language: string;
    timezone: string;
  };

  // Nostr Configuration
  nostr: {
    defaultRelays: string[];
    communityDomains: string[];
    communityTags: string[];
    clientTag: string;
  };

  // Features
  features: {
    events: boolean;
    mediaGallery: boolean;
    bitcoinPrice: boolean;
    leaderboard: boolean;
    achievements: boolean;
    zaps: boolean;
  };

  // Social Links
  social?: {
    twitter?: string;
    whatsapp?: string;
    github?: string;
    youtube?: string;
  };
}

// Default configuration for Island Bitcoin
const defaultConfig: SiteConfig = {
  name: "Island Bitcoin",
  tagline: "Bitcoin in Paradise",
  description: "Join the vibrant Bitcoin community in the Caribbean. Events, education, and connection through Nostr.",
  url: "https://islandbitcoin.com",

  themeColor: "#FF6B35",
  accentColor: "#00A5CF",

  community: {
    location: "Caribbean",
    currency: "USD",
    language: "en",
    timezone: "America/Jamaica",
  },

  nostr: {
    defaultRelays: ["wss://relay.nostr.band", "wss://relay.damus.io", "wss://relay.primal.net"],
    communityDomains: ["islandbitcoin.com", "getflash.io", "flashapp.me", "bitcoinindonesia.xyz", "bitcoindominica.com", "yesbitcoinhaiti.com"],
    communityTags: ["islandbitcoin", "caribbean", "bitcoin"],
    clientTag: "island-bitcoin-web",
  },

  features: {
    events: true,
    mediaGallery: true,
    bitcoinPrice: true,
    leaderboard: true,
    achievements: true,
    zaps: true,
  },

  social: {
    twitter: "https://x.com/Island_Btc",
    whatsapp: "https://chat.whatsapp.com/HdswRhtmRiHBkPo9euXCGL",
  },
};

// Load environment variables if available
const envConfig: Partial<SiteConfig> = {
  name: import.meta.env.VITE_SITE_NAME || defaultConfig.name,
  tagline: import.meta.env.VITE_SITE_TAGLINE || defaultConfig.tagline,
  description: import.meta.env.VITE_SITE_DESCRIPTION || defaultConfig.description,
  url: import.meta.env.VITE_SITE_URL || defaultConfig.url,
  themeColor: import.meta.env.VITE_THEME_COLOR || defaultConfig.themeColor,
  accentColor: import.meta.env.VITE_ACCENT_COLOR || defaultConfig.accentColor,
};

// Merge configurations
export const siteConfig: SiteConfig = {
  ...defaultConfig,
  ...envConfig,
  community: {
    ...defaultConfig.community,
    location: import.meta.env.VITE_COMMUNITY_LOCATION || defaultConfig.community.location,
    currency: import.meta.env.VITE_COMMUNITY_CURRENCY || defaultConfig.community.currency,
    language: import.meta.env.VITE_COMMUNITY_LANGUAGE || defaultConfig.community.language,
    timezone: import.meta.env.VITE_COMMUNITY_TIMEZONE || defaultConfig.community.timezone,
  },
  nostr: {
    ...defaultConfig.nostr,
    communityDomains: import.meta.env.VITE_NOSTR_DOMAINS?.split(",") || defaultConfig.nostr.communityDomains,
    communityTags: import.meta.env.VITE_NOSTR_TAGS?.split(",") || defaultConfig.nostr.communityTags,
  },
};

// Helper function to get themed names/content
export function getThemedContent(template: string): string {
  return template
    .replace(/\{name\}/g, siteConfig.name)
    .replace(/\{location\}/g, siteConfig.community.location)
    .replace(/\{tagline\}/g, siteConfig.tagline);
}
