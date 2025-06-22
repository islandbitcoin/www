// Simplified pull payment system for withdrawals
import QRCode from 'qrcode';

// Bech32 encoding functions for LNURL
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ value;
    for (let i = 0; i < 5; i++) {
      chk ^= ((top >> i) & 1) ? GEN[i] : 0;
    }
  }
  return chk;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = [...hrp.split('').map(c => c.charCodeAt(0) >> 5), 0, ...hrp.split('').map(c => c.charCodeAt(0) & 31), ...data];
  const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> 5 * (5 - i)) & 31);
  }
  return checksum;
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;
  
  for (const value of data) {
    if (value < 0 || (value >> fromBits)) return null;
    acc = ((acc << fromBits) | value) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  
  if (pad) {
    if (bits) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }
  
  return ret;
}

function encodeLnurl(url: string): string {
  const urlBytes = new TextEncoder().encode(url);
  const converted = convertBits(Array.from(urlBytes), 8, 5, true);
  if (!converted) throw new Error('Failed to convert bits');
  
  const checksum = bech32CreateChecksum('lnurl', converted);
  const combined = [...converted, ...checksum];
  
  return 'lnurl1' + combined.map(i => CHARSET[i]).join('');
}

import { BTCPayApiClient } from './btcpayApi';

export interface PullPaymentConfig {
  pullPaymentId?: string; // Optional - for legacy shared pull payment
  serverUrl: string;
  storeId?: string;
  apiKey?: string;
}

export async function generateWithdrawalQR(
  config: PullPaymentConfig, 
  amount: number, 
  description: string,
  userPubkey?: string
): Promise<{ qrCodeUrl: string; lnurl: string; pullPaymentId: string } | null> {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }
    
    let pullPaymentId: string;
    
    // If API credentials are provided, create a unique pull payment
    if (config.storeId && config.apiKey) {
      const btcpayClient = new BTCPayApiClient(config.serverUrl, config.storeId, config.apiKey);
      
      // Create a pull payment with exact amount (both min and max set to same value)
      const pullPayment = await btcpayClient.createPullPayment({
        name: `Withdrawal - ${amount} sats`,
        description: description + (userPubkey ? ` (${userPubkey.slice(0, 8)})` : ''),
        amount: amount.toString(),
        minAmount: amount.toString(), // Set minimum to exact amount
        currency: 'SATS',
        autoApproveClaims: true,
        BOLT11Expiration: 3600, // 1 hour
        expiresAt: Math.floor(Date.now() / 1000) + 86400, // Expires in 24 hours
      });
      
      pullPaymentId = pullPayment.id;
      } else if (config.pullPaymentId) {
      // Fall back to shared pull payment (legacy)
      pullPaymentId = config.pullPaymentId;
      } else {
      throw new Error('No pull payment configuration available');
    }
    
    // Generate LNURL-withdraw link using BTCPay pull payment endpoint
    const lnurlEndpoint = `${config.serverUrl}/BTC/UILNURL/withdraw/pp/${pullPaymentId}`;
    
    // Properly encode as LNURL using bech32
    const lnurl = encodeLnurl(lnurlEndpoint);
    
    // Log the URL for debugging but mask sensitive data
    // const maskedEndpoint = lnurlEndpoint.replace(/\/pp\/[^/]+/, '/pp/***');
    // Generate QR code with lowercase LNURL (better compatibility)
    const qrCodeUrl = await QRCode.toDataURL(lnurl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return { qrCodeUrl, lnurl: lnurl, pullPaymentId };
  } catch (error) {
    console.error('Failed to generate withdrawal QR:', error);
    return null;
  }
}

export function isPullPaymentConfigured(config: { pullPaymentId?: string; btcPayServerUrl?: string }): boolean {
  return !!(config.pullPaymentId && config.btcPayServerUrl);
}