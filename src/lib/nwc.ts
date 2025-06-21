/**
 * Nostr Wallet Connect (NIP-47) implementation for game rewards
 */

import { nip04, nip19, getPublicKey } from 'nostr-tools';
import { NostrEvent } from '@nostrify/nostrify';
import { secureStorage } from './secureStorage';

// NWC Event Kinds
export const NWC_INFO_EVENT_KIND = 13194;
export const NWC_REQUEST_KIND = 23194;
export const NWC_RESPONSE_KIND = 23195;
export const NWC_NOTIFICATION_KIND = 23196;

export interface NWCConnection {
  walletPubkey: string;
  relayUrl: string;
  secret: string;
  lud16?: string;
}

export interface NWCMethod {
  method: string;
  params?: Record<string, any>;
}

export interface NWCResponse {
  result_type: string;
  result?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface WalletInfo {
  methods: string[];
  notifications: string[];
  balance?: number;
  max_amount?: number;
  budget_renewal?: string;
}

export class NWCClient {
  private connection: NWCConnection | null = null;
  private secretKey: Uint8Array | null = null;
  private pubkey: string | null = null;
  private nostr: any = null;
  
  constructor(nostr: any) {
    this.nostr = nostr;
  }

  /**
   * Parse NWC connection URI
   */
  static parseConnectionUri(uri: string): NWCConnection {
    const url = new URL(uri);
    
    if (url.protocol !== 'nostr+walletconnect:') {
      throw new Error('Invalid NWC URI protocol');
    }
    
    const walletPubkey = url.hostname || url.pathname.replace('//', '');
    const params = new URLSearchParams(url.search);
    
    const relayUrl = params.get('relay');
    const secret = params.get('secret');
    const lud16 = params.get('lud16');
    
    if (!walletPubkey || !relayUrl || !secret) {
      throw new Error('Missing required NWC parameters');
    }
    
    // Validate hex formats
    if (!/^[0-9a-f]{64}$/i.test(walletPubkey)) {
      throw new Error('Invalid wallet pubkey format');
    }
    
    if (!/^[0-9a-f]{64}$/i.test(secret)) {
      throw new Error('Invalid secret format');
    }
    
    return {
      walletPubkey,
      relayUrl,
      secret,
      lud16,
    };
  }

  /**
   * Connect to wallet using NWC URI
   */
  async connect(uri: string): Promise<WalletInfo> {
    try {
      this.connection = NWCClient.parseConnectionUri(uri);
      
      // Generate ephemeral key from secret
      this.secretKey = new TextEncoder().encode(this.connection.secret).slice(0, 32);
      this.pubkey = getPublicKey(this.secretKey);
      
      // Get wallet info
      const info = await this.getWalletInfo();
      
      // Store encrypted connection
      secureStorage.set('nwc-connection', {
        uri: uri,
        connectedAt: new Date().toISOString(),
        walletPubkey: this.connection.walletPubkey,
      });
      
      return info;
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.connection = null;
    this.secretKey = null;
    this.pubkey = null;
    secureStorage.remove('nwc-connection');
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get wallet info and capabilities
   */
  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    // Query for info event
    const events = await this.nostr.query([
      {
        kinds: [NWC_INFO_EVENT_KIND],
        authors: [this.connection.walletPubkey],
        limit: 1,
      }
    ], { 
      relay: this.connection.relayUrl,
      signal: AbortSignal.timeout(5000),
    });

    if (events.length === 0) {
      throw new Error('Wallet info not found');
    }

    const infoEvent = events[0];
    return JSON.parse(infoEvent.content);
  }

  /**
   * Make a request to the wallet
   */
  async request(method: string, params?: Record<string, any>): Promise<NWCResponse> {
    if (!this.connection || !this.secretKey || !this.pubkey) {
      throw new Error('Wallet not connected');
    }

    // Create request payload
    const payload = JSON.stringify({
      method,
      params: params || {},
    });

    // Encrypt payload
    const encrypted = await nip04.encrypt(
      this.secretKey,
      this.connection.walletPubkey,
      payload
    );

    // Create request event
    const event = {
      kind: NWC_REQUEST_KIND,
      content: encrypted,
      tags: [
        ['p', this.connection.walletPubkey],
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: this.pubkey,
    };

    // Sign and publish event
    const signedEvent = await this.nostr.sign(event);
    await this.nostr.publish(signedEvent, { relay: this.connection.relayUrl });

    // Wait for response
    const response = await this.waitForResponse(signedEvent.id);
    return response;
  }

  /**
   * Wait for wallet response
   */
  private async waitForResponse(requestId: string, timeout = 10000): Promise<NWCResponse> {
    if (!this.connection || !this.secretKey) {
      throw new Error('Wallet not connected');
    }

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const events = await this.nostr.query([
        {
          kinds: [NWC_RESPONSE_KIND],
          authors: [this.connection.walletPubkey],
          '#e': [requestId],
          limit: 1,
        }
      ], {
        relay: this.connection.relayUrl,
        signal: AbortSignal.timeout(2000),
      });

      if (events.length > 0) {
        const responseEvent = events[0];
        
        // Decrypt response
        const decrypted = await nip04.decrypt(
          this.secretKey,
          this.connection.walletPubkey,
          responseEvent.content
        );
        
        return JSON.parse(decrypted);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Request timeout');
  }

  /**
   * Pay a Lightning invoice
   */
  async payInvoice(invoice: string, amount?: number): Promise<{
    preimage: string;
    fees_paid: number;
  }> {
    const response = await this.request('pay_invoice', {
      invoice,
      ...(amount && { amount }),
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  /**
   * Make a Lightning invoice
   */
  async makeInvoice(amount: number, description: string): Promise<{
    invoice: string;
    payment_hash: string;
  }> {
    const response = await this.request('make_invoice', {
      amount,
      description,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ balance: number }> {
    const response = await this.request('get_balance');

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  /**
   * List recent transactions
   */
  async listTransactions(limit = 10): Promise<any[]> {
    const response = await this.request('list_transactions', {
      limit,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result.transactions || [];
  }
}

// Singleton instance manager
let nwcInstance: NWCClient | null = null;

export function getNWCClient(nostr: any): NWCClient {
  if (!nwcInstance) {
    nwcInstance = new NWCClient(nostr);
  }
  return nwcInstance;
}