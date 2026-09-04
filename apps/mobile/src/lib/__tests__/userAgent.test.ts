import { Platform } from 'react-native';
import { buildUserAgent } from '../userAgent';

jest.mock('expo-device', () => ({
  __esModule: true,
  modelName: 'iPhone 15 Pro',
  osName: 'iOS',
  osVersion: '17.4',
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.3' } },
}));

const device = jest.requireMock('expo-device') as {
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
};

describe('buildUserAgent', () => {
  afterEach(() => {
    device.modelName = 'iPhone 15 Pro';
    device.osName = 'iOS';
    device.osVersion = '17.4';
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('names the app version, device model and OS in the shape the API parses', () => {
    expect(buildUserAgent()).toBe('TrakwynMobile/1.2.3 (iPhone 15 Pro; iOS 17.4)');
  });

  it('leaves the model empty when the device does not report one (simulators)', () => {
    device.modelName = null;

    expect(buildUserAgent()).toBe('TrakwynMobile/1.2.3 (; iOS 17.4)');
  });

  it('returns null on web, where the browser owns the header', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });

    expect(buildUserAgent()).toBeNull();
  });
});
