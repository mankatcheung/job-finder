import type { AwilixContainer } from 'awilix';
import type { Cradle } from '@fastify/awilix';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface JwtUser {
  sub: string;
  email: string;
  /** Session id — present for JWT-authenticated requests, absent for API-token auth (no session). */
  sid?: string;
}

export interface GraphQLContext {
  user: JwtUser | null;
  diScope: AwilixContainer<Cradle>;
  request: FastifyRequest;
  reply: FastifyReply;
}
