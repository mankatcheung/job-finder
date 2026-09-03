// iOS Simulator and Android Emulator can both reach the host machine's own
// localhost, but a physical device on the same network cannot — point
// EXPO_PUBLIC_API_URL at the machine's LAN IP (e.g. http://192.168.1.20:3001/graphql)
// when testing on a real device.
export const DEFAULT_API_URL = 'http://localhost:3001/graphql';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

/** Sibling of the GraphQL endpoint for the chat streaming SSE route (mirrors apps/web's CHAT_STREAM_URL) — not itself a GraphQL endpoint. */
export const CHAT_STREAM_URL = API_URL.replace(/\/graphql$/, '/chat/stream');

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
