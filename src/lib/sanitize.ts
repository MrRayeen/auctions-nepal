/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Sanitize string to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return String(str).replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize user display name
 */
export function sanitizeUserName(name: string | null | undefined): string {
  const sanitized = sanitizeString(name);
  // Also limit length to prevent UI issues
  return sanitized.slice(0, 100);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  const sanitized = sanitizeString(email);
  // Email should follow email format, but sanitize just in case
  return sanitized.slice(0, 255);
}

/**
 * Sanitize message content
 */
export function sanitizeMessage(message: string): string {
  const sanitized = sanitizeString(message);
  // Limit message length
  return sanitized.slice(0, 5000);
}

/**
 * Batch sanitize multiple fields
 */
export function sanitizeUser(user: {
  id?: number;
  name?: string | null;
  email?: string;
  userName?: string;
}): {
  id?: number;
  name?: string;
  email?: string;
  userName?: string;
} {
  return {
    id: user.id,
    name: user.name ? sanitizeUserName(user.name) : undefined,
    email: user.email ? sanitizeEmail(user.email) : undefined,
    userName: user.userName ? sanitizeUserName(user.userName) : undefined,
  };
}
