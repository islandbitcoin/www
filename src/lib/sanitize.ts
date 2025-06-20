/**
 * Sanitize user input to prevent XSS attacks
 */

// List of allowed HTML tags in user content (for future use)
const _ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'br'];

// List of allowed attributes for specific tags (for future use)
const _ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
};

// Regex patterns for dangerous content (for future use)
const _DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
const _DANGEROUS_ATTRIBUTES = /^on\w+/i;

export function sanitizeHtml(input: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = input; // This escapes all HTML by default
  
  // For now, we'll keep all content as plain text
  // In the future, we could selectively allow certain tags
  return temp.innerHTML;
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) and lightning protocols
    if (!['http:', 'https:', 'lightning:'].includes(parsed.protocol)) {
      return '#';
    }
    
    return url;
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    
    return '#';
  }
}

export function sanitizeNostrContent(content: string): string {
  // Remove any potential script tags or dangerous HTML
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .trim();
}

export function sanitizeProfileData(data: unknown): Record<string, string> {
  if (typeof data !== 'object' || data === null) {
    return {};
  }

  const sanitized: Record<string, string> = {};
  
  // Whitelist of allowed profile fields
  const allowedFields = ['name', 'about', 'picture', 'banner', 'nip05', 'lud16', 'website'];
  
  for (const field of allowedFields) {
    if (field in data) {
      const dataObj = data as Record<string, unknown>;
      if (field === 'picture' || field === 'banner' || field === 'website') {
        sanitized[field] = sanitizeUrl(String(dataObj[field] || ''));
      } else {
        sanitized[field] = sanitizeHtml(String(dataObj[field] || ''));
      }
    }
  }
  
  return sanitized;
}