import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { ENV, ROUTES } from '@/constants.js';
import { isAuthorizedCronTrigger } from '@/http/plugins/cronAuth.js';

export default fp(async (fastify: FastifyInstance) => {
  // GET so Vercel Cron (which only issues GET requests) can trigger this
  // directly; POST kept for manual/external triggering.
  fastify.route({
    method: ['GET', 'POST'],
    url: ROUTES.DIGEST_SEND,
    handler: async (request, reply) => {
      if (!process.env[ENV.DIGEST_ADMIN_SECRET] && !process.env[ENV.CRON_SECRET]) {
        return reply
          .status(503)
          .send({ error: 'Digest not configured (DIGEST_ADMIN_SECRET/CRON_SECRET missing)' });
      }

      if (!isAuthorizedCronTrigger(request, ENV.DIGEST_ADMIN_SECRET)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const { sendWeeklyDigestUseCase } = fastify.diContainer.cradle;
        const summary = await sendWeeklyDigestUseCase.execute();
        return reply.send({ ok: true, summary });
      } catch (err) {
        fastify.log.error(err, 'Weekly digest failed');
        return reply.status(500).send({ error: 'Digest failed' });
      }
    },
  });
});
