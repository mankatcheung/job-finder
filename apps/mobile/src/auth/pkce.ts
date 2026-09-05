import * as Crypto from 'expo-crypto';

export interface PkcePair {
  verifier: string;
  challenge: string;
}

/** Standard base64 → base64url: unreserved characters only, no padding (RFC 7636 s4.1). */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * React Native has no global `Buffer` — this app doesn't polyfill Node's
 * buffer module elsewhere, so random bytes are base64-encoded by hand rather
 * than pulling one in for a single call site.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]!;
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    const triplet = (b1 << 16) | ((b2 ?? 0) << 8) | (b3 ?? 0);
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += b2 !== undefined ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += b3 !== undefined ? BASE64_CHARS[triplet & 0x3f] : '=';
  }
  return result;
}

/**
 * PKCE (RFC 7636) for the mobile handoff (JEF-275): generated here, before
 * `loginWithOAuth` opens the system browser, so `challenge` can ride the
 * `/start` redirect while `verifier` stays in this call's own closure until
 * `exchangeMobileOAuthCode` presents it — see MobileOAuthHandoffService on
 * the API side for what that binds shut.
 */
export async function createPkcePair(): Promise<PkcePair> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const verifier = toBase64Url(bytesToBase64(randomBytes));
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return { verifier, challenge: toBase64Url(digest) };
}
