// BTCPay Server API client for managing pull payments

export interface CreatePullPaymentRequest {
  name: string;
  description?: string;
  amount: string; // Amount in sats
  currency: string;
  period?: number; // Seconds
  BOLT11Expiration?: number; // Seconds
  autoApproveClaims?: boolean;
  startsAt?: number; // Unix timestamp
  expiresAt?: number; // Unix timestamp
  minAmount?: string; // Minimum amount in sats
}

export interface PullPaymentResponse {
  id: string;
  name: string;
  description: string;
  currency: string;
  amount: string;
  period: number | null;
  BOLT11Expiration: number;
  archived: boolean;
  viewLink: string;
  autoApproveClaims: boolean;
}

export class BTCPayApiClient {
  private baseUrl: string;
  private storeId: string;
  private apiKey: string;

  constructor(baseUrl: string, storeId: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.storeId = storeId;
    this.apiKey = apiKey;
  }

  async createPullPayment(request: CreatePullPaymentRequest): Promise<PullPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/stores/${this.storeId}/pull-payments`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Failed to create pull payment: ${response.status} ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('🔗 BTCPay API: Error creating pull payment:', error);
      throw error;
    }
  }

  async deletePullPayment(pullPaymentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/stores/${this.storeId}/pull-payments/${pullPaymentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.apiKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete pull payment: ${response.status} ${response.statusText}`);
    }
  }

  async archivePullPayment(pullPaymentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/stores/${this.storeId}/pull-payments/${pullPaymentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.apiKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to archive pull payment: ${response.status} ${response.statusText}`);
    }
  }
}