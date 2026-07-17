import Fastify from 'fastify';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import mercurius from 'mercurius';
import cookie from '@fastify/cookie';

import authPlugin from '@/http/plugins/auth.plugin.js';
import corsPlugin from '@/http/plugins/cors.plugin.js';
import { buildContainer } from '@/http/container.js';
import { schema } from '@/http/schema/index.js';
import { formatError } from '@/http/errors/formatError.js';
import type { GraphQLContext } from '@/http/context.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  await fastify.register(corsPlugin);
  await fastify.register(cookie);
  await fastify.register(authPlugin);
  await fastify.register(fastifyAwilixPlugin, { disposeOnClose: true, disposeOnResponse: true });

  buildContainer(fastify);

  await fastify.register(mercurius, {
    schema,
    graphiql: process.env.NODE_ENV !== 'production',
    errorFormatter: (result) => {
      const errors = result.errors?.map(formatError);
      return { statusCode: 200, response: { ...result, errors } };
    },
    context: (request, reply): GraphQLContext => {
      let user = null;
      const token = request.cookies.jf_access_token;
      if (token) {
        try {
          user = fastify.jwt.verify<{ sub: string; email: string }>(token);
        } catch {
          // Expired/invalid token — resolvers enforce auth
        }
      }
      return {
        user,
        diScope: (request as any).diScope,
        request,
        reply,
      };
    },
  });

  return fastify;
}
