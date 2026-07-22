import Fastify from 'fastify';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import mercurius from 'mercurius';
import cookie from '@fastify/cookie';

import authPlugin from '@/http/plugins/auth.plugin.js';
import corsPlugin from '@/http/plugins/cors.plugin.js';
import remindersPlugin from '@/http/plugins/reminders.plugin.js';
import digestPlugin from '@/http/plugins/digest.plugin.js';
import mcpPlugin from '@/http/plugins/mcp.plugin.js';
import { buildContainer } from '@/http/container.js';
import { schema } from '@/http/schema/index.js';
import { formatError } from '@/http/errors/formatError.js';
import type { GraphQLContext } from '@/http/context.js';
import {
  fastifyOtelInstrumentation,
  isObservabilityEnabled,
} from '@/infrastructure/observability/tracing.js';
import { API_TOKEN, API_TOKEN_SCOPE, AUTH_HEADER, COOKIES, ENV, NODE_ENV } from '@/constants.js';

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
  await fastify.register(authPlugin);
  await fastify.register(fastifyAwilixPlugin, { disposeOnClose: true, disposeOnResponse: true });

  buildContainer(fastify);

  await fastify.register(remindersPlugin);
  await fastify.register(digestPlugin);
  await fastify.register(mcpPlugin);

  await fastify.register(mercurius, {
    schema,
    graphiql: process.env[ENV.NODE_ENV] !== NODE_ENV.PRODUCTION,
    errorFormatter: (result) => {
      const errors = result.errors?.map(formatError);
      return { statusCode: 200, response: { ...result, errors } };
    },
    context: async (request, reply): Promise<GraphQLContext> => {
      let user: { sub: string; email: string } | null = null;

      const cookieToken = request.cookies[COOKIES.ACCESS_TOKEN];
      const authHeader = request.headers.authorization;
      const bearerToken = authHeader?.startsWith(AUTH_HEADER.BEARER_PREFIX)
        ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
        : null;
      const rawToken = cookieToken ?? bearerToken;

      if (rawToken) {
        if (rawToken.startsWith(API_TOKEN.PREFIX)) {
          // API token path — hash and look up in DB
          // Read-scoped tokens are MCP-only and cannot authenticate GraphQL
          try {
            const { validateApiTokenUseCase } = request.diScope.cradle;
            const result = await validateApiTokenUseCase.execute(rawToken);
            if (result && result.scope === API_TOKEN_SCOPE.FULL) {
              user = { sub: result.sub, email: result.email };
            }
          } catch {
            // Invalid API token — unauthenticated
          }
        } else {
          // JWT path
          try {
            user = fastify.jwt.verify<{ sub: string; email: string }>(rawToken);
          } catch {
            // Expired/invalid token — resolvers enforce auth
          }
        }
      }

      return {
        user,
        diScope: request.diScope,
        request,
        reply,
      };
    },
  });

  return fastify;
}
