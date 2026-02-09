/** [FIX 4.4] HTML entity escaping to prevent XSS in generated HTML. */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/** [FIX 4.5] Validates that a URL points to a trusted PingDish domain. */
const ALLOWED_DOMAINS = ['kitchen.pingdish.com', 'localhost'];

export function isValidKitchenUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && parsed.hostname === 'localhost')) {
      return false;
    }
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}
