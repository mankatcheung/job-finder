import type { AwilixContainer } from 'awilix';
import type { Cradle } from '#src/http/container.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';

export interface JwtUser {
  sub: string;
  email: string;
  /** Session id — present for JWT-authenticated requests, absent for API-token auth (no session). */
  sid?: string;
}

export interface GraphQLContext {
  user: JwtUser | null;
  diScope: AwilixContainer<Cradle>;
  request: IHttpRequest;
  reply: IHttpResponse;
}
