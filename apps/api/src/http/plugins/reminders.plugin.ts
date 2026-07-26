import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { ENV, ROUTES } from '@/constants.js';
import { isAuthorizedCronTrigger } from '@/http/plugins/cronAuth.js';

/**
 * Was an in-process setInterval poll; converted to an external-trigger route
 * (mirrors digest.plugin.ts) because a setInterval can't survive Vercel's
 * serverless model — the process doesn't stay alive between requests, so
 * nothing would ever fire it. Driven by Vercel Cron in production.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.route({
    method: ['GET', 'POST'],
    url: ROUTES.REMINDERS_SEND,
    handler: async (request, reply) => {
      if (!process.env[ENV.CRON_SECRET]) {
        return reply.status(503).send({ error: 'Reminders not configured (CRON_SECRET missing)' });
      }

      if (!isAuthorizedCronTrigger(request, ENV.CRON_SECRET)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const { sendFollowUpRemindersUseCase } = fastify.diContainer.cradle;
        await sendFollowUpRemindersUseCase.execute();
        return reply.send({ ok: true });
      } catch (err) {
        fastify.log.error(err, 'Follow-up reminders failed');
        return reply.status(500).send({ error: 'Reminders failed' });
      }
    },
  });
});
