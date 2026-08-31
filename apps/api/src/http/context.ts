import type { AwilixContainer } from 'awilix';
import type { Cradle } from '#src/http/container.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';

export interface JwtUser {
  sub: string;
  email: string;
  /** Session id — present for JWT-authenticated requests, absent for API-token auth (no session). */
  sid?: string;
  /** Epoch-ms of the session's last full authentication — absent for API-token auth, or for a JWT issued before step-up auth (JEF-44) existed. See `REAUTH` in constants.ts. */
  authTime?: number;
}

export interface GraphQLContext {
  user: JwtUser | null;
  diScope: AwilixContainer<Cradle>;
  request: IHttpRequest;
  reply: IHttpResponse;
}
