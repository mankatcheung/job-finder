export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
}

/**
 * Roughly Fastify-shaped response wrapper used by route handlers. The
 * `rawReply` escape hatch is intentional — it lets a route reach the
 * underlying Fastify reply for things the port can't surface (e.g.
 * streaming raw uploads via reply.raw). All other operations should go
 * through the typed methods.
 */
export interface IHttpResponse {
  status(code: number): IHttpResponse;
  send(body?: unknown): void;
  redirect(url: string): void;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  clearCookie(name: string, options?: Pick<CookieOptions, 'path'>): void;
  setHeader(name: string, value: string | number): void;
}
