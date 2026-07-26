export interface IHttpRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string | undefined>;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
  ip: string | null;
  protocol: string;
}
