import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  const run = async () => {
    try {
      const { sendFollowUpRemindersUseCase } = fastify.diContainer.cradle;
      await sendFollowUpRemindersUseCase.execute();
    } catch {
      // swallow — don't crash the server
    }
  };

  const timer = setInterval(run, INTERVAL_MS);
  fastify.addHook('onClose', () => { clearInterval(timer); });
});
