/**
 * Parses a raw User-Agent string into a human-readable device label.
 */
export interface IDeviceLabeler {
  /** Returns a friendly device label, or "Unknown device" when unrecognisable. */
  describe(userAgent: string | null): string;
}
