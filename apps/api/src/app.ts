import Fastify from 'fastify';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import mercurius from 'mercurius';
import cookie from '@fastify/cookie';

import corsPlugin from '@/http/adapters/fastify/corsPlugin.js';
import { registerRoutes } from '@/http/adapters/fastify/registerRoutes.js';
import { toHttpRequest } from '@/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '@/http/adapters/fastify/toHttpResponse.js';
import { buildGraphQLContext } from '@/http/adapters/fastify/buildGraphQLContext.js';
import { diScopeOf } from '@/http/adapters/fastify/diScope.js';
import { remindersRoutes } from '@/http/routes/reminders.routes.js';
import { digestRoutes } from '@/http/routes/digest.routes.js';
import { mcpRoutes } from '@/http/routes/mcp.routes.js';
import { oauthRoutes } from '@/http/routes/oauth.routes.js';
import { buildContainer } from '@/http/container.js';
import { schema } from '@/http/schema/index.js';
import { formatError } from '@/http/errors/formatError.js';
import { PinoLogger } from '@/infrastructure/observability/PinoLogger.js';
import {
  fastifyOtelInstrumentation,
  isObservabilityEnabled,
} from '@/infrastructure/observability/tracing.js';
import { asValue } from 'awilix';
import { ENV, NODE_ENV, ROUTES } from '@/constants.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env[ENV.NODE_ENV] === NODE_ENV.PRODUCTION ? 'warn' : 'info',
      transport: isObservabilityEnabled
        ? {
            target: '@axiomhq/pino',
            options: {
              dataset: process.env[ENV.AXIOM_DATASET],
              token: process.env[ENV.AXIOM_TOKEN],
            },
          }
        : undefined,
    },
  });

  // Must be registered before any routes/plugins are defined so it can wrap
  // every route handler and lifecycle hook — see tracing.ts.
  if (isObservabilityEnabled) {
    await fastify.register(fastifyOtelInstrumentation.plugin());
  }

  await fastify.register(corsPlugin);
  await fastify.register(cookie);

  const container = buildContainer();
  container.register({ logger: asValue(new PinoLogger(fastify.log)) });

  await fastify.register(fastifyAwilixPlugin, {
    container,
    disposeOnClose: true,
    disposeOnResponse: true,
  });

  // Root-scope routes — no per-request DI resolution needed.
  registerRoutes(fastify, [
    ...remindersRoutes(() => container.cradle),
    ...digestRoutes(() => container.cradle),
  ]);

  // Per-request-scope routes: each request's own DI scope (session/request
  // lifetime registrations) must be resolved fresh per request, so these
  // route definitions are (re)built inside the handler rather than once at
  // startup — mirrors the GraphQL context's auth resolution below.
  fastify.route({
    method: 'POST',
    url: ROUTES.MCP,
    handler: async (request, reply) => {
      const [route] = mcpRoutes(() => diScopeOf(request).cradle);
      await route.handler(toHttpRequest(request), toHttpResponse(reply));
    },
  });
  fastify.route({
    method: 'GET',
    url: ROUTES.OAUTH_START,
    handler: async (request, reply) => {
      const route = oauthRoutes(() => diScopeOf(request).cradle).find(
        (r) => r.path === ROUTES.OAUTH_START,
      )!;
      await route.handler(toHttpRequest(request), toHttpResponse(reply));
    },
  });
  fastify.route({
    method: 'GET',
    url: ROUTES.OAUTH_CALLBACK,
    handler: async (request, reply) => {
      const route = oauthRoutes(() => diScopeOf(request).cradle).find(
        (r) => r.path === ROUTES.OAUTH_CALLBACK,
      )!;
      await route.handler(toHttpRequest(request), toHttpResponse(reply));
    },
  });

  await fastify.register(mercurius, {
    schema,
    graphiql: process.env[ENV.NODE_ENV] !== NODE_ENV.PRODUCTION,
    errorFormatter: (result) => {
      const errors = result.errors?.map(formatError);
      return { statusCode: 200, response: { ...result, errors } };
    },
    context: buildGraphQLContext,
  });

  return fastify;
}
