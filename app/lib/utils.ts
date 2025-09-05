import 'server-only';

/**
 * Strip HTML tags from a string (very basic sanitization).
 * Not for untrusted rich HTML, just prevents simple tag injection in prompts.
 */
export function sanitize(input: string): string {
  return input.replace(/<[^>]*>?/gm, '');
}
