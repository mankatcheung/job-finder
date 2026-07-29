import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';
import type { FastifyRequest } from 'fastify';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteHandler = (
  req: IHttpRequest,
  res: IHttpResponse,
  rawRequest?: FastifyRequest,
) => Promise<void> | void;

export interface RouteDefinition {
  method: HttpMethod | HttpMethod[];
  path: string;
  handler: RouteHandler;
}
