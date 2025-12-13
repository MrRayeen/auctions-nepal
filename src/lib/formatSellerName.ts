/**
 * Formats a seller's name to a shortened format
 * Examples: "John Doe Smith" -> "John D. S.", "Jane" -> "Jane"
 * If no full name provided, extracts from email
 */
export function formatSellerName(fullName?: string | null, email?: string): string {
  // If fullName is provided, format it
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);
    
    if (parts.length === 0) return email?.split('@')[0] || 'Anonymous';
    if (parts.length === 1) return parts[0]; // "John" -> "John"
    
    // "John Doe Smith" -> "John D. S."
    const firstName = parts[0];
    const initials = parts.slice(1).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
    return `${firstName} ${initials}`;
  }
  
  // Fallback to email
  if (email) {
    return email.split('@')[0];
  }
  
  return 'Anonymous';
}
