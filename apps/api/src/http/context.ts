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
  /**
   * Aborts if the client disconnects before this request finishes (JEF-240) —
   * a resolver that kicks off a slow/expensive outbound call (currently only
   * `sendChatMessage`'s LLM call) can pass this through so cancelling
   * client-side actually stops the work server-side, instead of it running
   * to completion for a response nobody reads. Deliberately on
   * `GraphQLContext`, not `IHttpRequest` — that port is a clean,
   * framework-free read model of the request; this is real Fastify-request
   * wiring (built in `buildGraphQLContext.ts`), which belongs at the
   * HTTP/resolver layer that already knows about Fastify.
   */
  abortSignal: AbortSignal;
}
