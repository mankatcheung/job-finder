import type { IHttpRequest } from '@/http/ports/IHttpRequest.js';
import type { IHttpResponse } from '@/http/ports/IHttpResponse.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteHandler = (req: IHttpRequest, res: IHttpResponse) => Promise<void> | void;

export interface RouteDefinition {
  method: HttpMethod | HttpMethod[];
  path: string;
  handler: RouteHandler;
}
