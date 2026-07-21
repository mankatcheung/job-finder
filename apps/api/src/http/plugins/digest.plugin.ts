import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  fastify.post('/admin/digest/send', async (request, reply) => {
    const secret = process.env.DIGEST_ADMIN_SECRET;
    if (!secret) {
      return reply
        .status(503)
        .send({ error: 'Digest not configured (DIGEST_ADMIN_SECRET missing)' });
    }

    const auth = request.headers.authorization;
    if (!auth || auth !== `Bearer ${secret}`) {
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
  });
});
