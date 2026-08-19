export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
}

export interface IHttpResponse {
  status(code: number): IHttpResponse;
  header(name: string, value: string): IHttpResponse;
  send(body?: unknown): void;
  redirect(url: string): void;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  clearCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void;
}
