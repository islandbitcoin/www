/**
 * Tor relay support for enhanced privacy
 * Uses .onion addresses when available
 */

import { siteConfig } from '@/config/site.config';
import { getUserPreferences } from './secureStorage';

interface TorRelay {
  clearnet: string;
  onion: string;
  name: string;
  description?: string;
}

// Known Tor-enabled relays
export const TOR_RELAYS: TorRelay[] = [
  {
    clearnet: 'wss://relay.damus.io',
    onion: 'wss://relay.h3z6e77xybrp2e7r7zweqxrxoiiko7jgqgwwwjzalpqinkwgfwpfqad.onion',
    name: 'Damus Tor',
    description: 'Official Damus relay with Tor support',
  },
  {
    clearnet: 'wss://nostr-pub.wellorder.net',
    onion: 'wss://nostr-pub.wellorder.net',
    name: 'Wellorder',
    description: 'Privacy-focused relay',
  },
  {
    clearnet: 'wss://relay.snort.social',
    onion: 'wss://relay.snort.social',
    name: 'Snort Social',
    description: 'Community relay with privacy features',
  },
];

export class TorRelayManager {
  private static instance: TorRelayManager;
  private isTorEnabled: boolean = false;
  private isTorAvailable: boolean = false;
  
  private constructor() {
    this.checkTorAvailability();
  }

  static getInstance(): TorRelayManager {
    if (!TorRelayManager.instance) {
      TorRelayManager.instance = new TorRelayManager();
    }
    return TorRelayManager.instance;
  }

  private async checkTorAvailability() {
    // Check if running through Tor Browser
    if (this.isTorBrowser()) {
      this.isTorAvailable = true;
      return;
    }

    // Check if user has configured a proxy
    const preferences = getUserPreferences();
    if (preferences.preferredRelays?.some(url => url.includes('.onion'))) {
      this.isTorAvailable = true;
    }

    // Check if browser supports proxy configuration
    if ('proxy' in navigator) {
      this.isTorAvailable = true;
    }
  }

  private isTorBrowser(): boolean {
    // Tor Browser has specific characteristics
    const userAgent = navigator.userAgent;
    
    // Check for Tor Browser fingerprint
    if (userAgent.includes('Tor')) {
      return true;
    }

    // Check screen dimensions (Tor Browser uses specific sizes)
    const torSizes = [
      { width: 1000, height: 1000 },
      { width: 1200, height: 900 },
    ];

    return torSizes.some(size => 
      window.screen.width === size.width && 
      window.screen.height === size.height
    );
  }

  isAvailable(): boolean {
    return this.isTorAvailable;
  }

  isEnabled(): boolean {
    const preferences = getUserPreferences();
    return this.isTorEnabled || preferences.useTorRelays || false;
  }

  enable() {
    this.isTorEnabled = true;
  }

  disable() {
    this.isTorEnabled = false;
  }

  getRelayUrl(clearnetUrl: string): string {
    if (!this.isEnabled()) {
      return clearnetUrl;
    }

    // Find matching Tor relay
    const torRelay = TOR_RELAYS.find(relay => relay.clearnet === clearnetUrl);
    
    if (torRelay && torRelay.onion) {
      return torRelay.onion;
    }

    // Return original URL if no Tor alternative
    return clearnetUrl;
  }

  getAllRelays(includeTorOnly: boolean = false): string[] {
    const relays = [...siteConfig.nostr.defaultRelays];
    
    if (this.isEnabled()) {
      // Replace with onion addresses where available
      const torRelays = relays.map(url => this.getRelayUrl(url));
      
      if (includeTorOnly) {
        // Add Tor-only relays
        TOR_RELAYS.forEach(relay => {
          if (!torRelays.includes(relay.onion)) {
            torRelays.push(relay.onion);
          }
        });
      }
      
      return torRelays;
    }
    
    return relays;
  }

  getTorRelays(): TorRelay[] {
    return TOR_RELAYS;
  }

  // Privacy mode settings
  getPrivacyHeaders(): Record<string, string> {
    if (!this.isEnabled()) {
      return {};
    }

    return {
      'X-Forwarded-For': '127.0.0.1',
      'X-Real-IP': '127.0.0.1',
      'DNT': '1',
    };
  }

  // Connection options for enhanced privacy
  getConnectionOptions() {
    if (!this.isEnabled()) {
      return {};
    }

    return {
      // Use longer timeouts for Tor
      timeout: 30000,
      // Disable any tracking or analytics
      tracking: false,
      // Use ephemeral connections
      ephemeral: true,
    };
  }
}

export const torRelayManager = TorRelayManager.getInstance();

// Hook for React components
export function useTorRelay() {
  const isAvailable = torRelayManager.isAvailable();
  const isEnabled = torRelayManager.isEnabled();

  const toggle = () => {
    if (isEnabled) {
      torRelayManager.disable();
    } else {
      torRelayManager.enable();
    }
  };

  return {
    isAvailable,
    isEnabled,
    toggle,
    relays: torRelayManager.getTorRelays(),
  };
}