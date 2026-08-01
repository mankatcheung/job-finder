/**
 * Resolves an IP address to a coarse-grained geographic location string.
 */
export interface IIpLocationResolver {
  /**
   * Best-effort location string, e.g. "San Jose, United States".
   * Returns `null` when the lookup fails or the IP is private/unresolvable.
   */
  lookup(ipAddress: string | null): Promise<string | null>;
}
