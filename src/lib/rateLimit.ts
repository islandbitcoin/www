/**
 * Rate limiting utilities for Nostr operations
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this key
    const existingRequests = this.requests.get(key) || [];
    
    // Filter out requests outside the current window
    const recentRequests = existingRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if we've exceeded the limit
    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add the current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.1) {
      this.cleanup();
    }
    
    return true;
  }
  
  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(t => t > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Rate limiters for different operations
export const queryRateLimiter = new RateLimiter({
  maxRequests: 20, // 20 queries
  windowMs: 60 * 1000, // per minute
});

export const postRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 posts
  windowMs: 60 * 1000, // per minute
});

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 uploads
  windowMs: 60 * 1000, // per minute
});

// Debounce function for search/typing operations
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function for scroll/resize operations
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}