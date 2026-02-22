/**
 * Check for spam using honeypot field and submission timing.
 * Returns { isSpam: boolean, reason: string|null }
 */
export function checkSpam(data) {
  // Honeypot field — should be empty (hidden from real users)
  if (data._honey) {
    return { isSpam: true, reason: 'honeypot' };
  }

  // Timestamp check — form should take at least 3 seconds to fill
  if (data._timestamp) {
    const submitted = parseInt(data._timestamp, 10);
    if (!isNaN(submitted)) {
      const elapsed = Date.now() - submitted;
      if (elapsed < 3000) {
        return { isSpam: true, reason: 'too_fast' };
      }
    }
  }

  // Basic email validation
  const email = data.email || data.Email || '';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isSpam: true, reason: 'invalid_email' };
  }

  return { isSpam: false, reason: null };
}
