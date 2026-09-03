import { describe, it, expect } from 'vitest';
import { DeviceLabelService } from '#src/infrastructure/device/DeviceLabelService.js';

const service = new DeviceLabelService();

describe('DeviceLabelService', () => {
  describe('the Trakwyn mobile app', () => {
    it('names the phone from the User-Agent apps/mobile sends', () => {
      expect(service.describe('TrakwynMobile/1.0.0 (iPhone 15 Pro; iOS 17.4)')).toBe(
        'iPhone 15 Pro — Trakwyn app',
      );
      expect(service.describe('TrakwynMobile/1.0.0 (Pixel 8; Android 14)')).toBe(
        'Pixel 8 — Trakwyn app',
      );
    });

    it('falls back to the OS when the device reports no model (simulators)', () => {
      expect(service.describe('TrakwynMobile/1.0.0 (; iOS 17.4)')).toBe('iOS 17.4 — Trakwyn app');
    });

    it('still names the app when neither is known', () => {
      expect(service.describe('TrakwynMobile/1.0.0 (; )')).toBe('Trakwyn app');
    });

    // What the sessions list showed for every phone before the app sent its own UA.
    it("does not recognise the HTTP clients' default strings", () => {
      expect(service.describe('okhttp/4.12.0')).toBe('Unknown device');
      expect(service.describe('Trakwyn/1 CFNetwork/1498.700.2 Darwin/23.6.0')).toBe(
        'Unknown device',
      );
    });
  });

  describe('browsers', () => {
    it('labels a desktop browser by OS and browser', () => {
      expect(
        service.describe(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ),
      ).toBe('Mac — Chrome 120.0.0.0');
    });

    it('labels an Android browser by device model', () => {
      expect(
        service.describe(
          'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        ),
      ).toBe('Android (Pixel 8) — Chrome 120.0.0.0');
    });

    it('returns "Unknown device" for a missing or unrecognisable User-Agent', () => {
      expect(service.describe(null)).toBe('Unknown device');
      expect(service.describe('curl/8.4.0')).toBe('Unknown device');
    });
  });
});
