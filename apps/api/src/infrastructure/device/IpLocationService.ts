/**
 * Resolves an IP address to a coarse-grained geographic location (city, country)
 * using the free ip-api.com JSON endpoint (no API key required, 45 req/min).
 *
 * Returns `null` when:
 *  - the IP is private/loopback (e.g. `127.0.0.1`, `192.168.x.x`)
 *  - the lookup fails or times out
 *  - the response contains no usable city/country data
 */
export class IpLocationService {
  private static readonly API_URL = 'http://ip-api.com/json';
  private static readonly TIMEOUT_MS = 2_000;

  /**
   * Best-effort location string, e.g. "San Jose, United States".
   * Returns `null` on any failure so the caller can degrade gracefully.
   */
  async lookup(ipAddress: string | null): Promise<string | null> {
    if (!ipAddress || this.isPrivate(ipAddress)) return null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), IpLocationService.TIMEOUT_MS);

      const res = await fetch(`${IpLocationService.API_URL}/${ipAddress}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) return null;

      const data = (await res.json()) as {
        status: string;
        city?: string;
        country?: string;
      };

      if (data.status !== 'success') return null;

      const parts = [data.city, data.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : null;
    } catch {
      return null;
    }
  }

  /** Returns true for private, loopback, and link-local addresses. */
  private isPrivate(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.') ||
      ip.startsWith('169.254.')
    );
  }
}
