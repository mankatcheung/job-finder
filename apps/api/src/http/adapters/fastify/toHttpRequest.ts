import type { FastifyRequest } from 'fastify';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';

export function toHttpRequest(request: FastifyRequest): IHttpRequest {
  return {
    method: request.method,
    path: request.url,
    headers: request.headers,
    cookies: request.cookies,
    params: request.params as Record<string, string>,
    query: request.query as Record<string, string | string[] | undefined>,
    body: request.body,
    ip: request.ip ?? null,
    protocol: request.protocol,
  };
}
