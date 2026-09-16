/**
 * Formats a clean human-readable name from an email address if full name is missing.
 * e.g., "john.doe@example.com" -> "John Doe"
 * e.g., "jithu_broker@domain.com" -> "Jithu Broker"
 */
export function getDisplayNameFromEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'User';

  const prefix = email.split('@')[0];
  // Replace dots, underscores, hyphens, and numbers at the end
  const cleaned = prefix.replace(/[._-]+/g, ' ').replace(/\d+$/g, '').trim();

  if (!cleaned) return 'User';

  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Resolves the primary display name for a user given their fullName or email.
 */
export function resolveUserDisplayName(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim();
  }
  if (email && email.trim().length > 0) {
    return getDisplayNameFromEmail(email);
  }
  return 'User';
}

/**
 * Returns 1 or 2 letter initials for avatar badges.
 * e.g., "John Doe" -> "JD", "Sarah" -> "S"
 */
export function getUserInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail || !nameOrEmail.trim()) return 'U';

  const text = nameOrEmail.includes('@') ? getDisplayNameFromEmail(nameOrEmail) : nameOrEmail.trim();

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return text.substring(0, 2).toUpperCase();
}
