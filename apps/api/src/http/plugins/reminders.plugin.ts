import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { DURATIONS_MS } from '@/constants.js';

export default fp(async (fastify: FastifyInstance) => {
  const INTERVAL_MS = DURATIONS_MS.REMINDER_INTERVAL;

  const run = async () => {
    try {
      const { sendFollowUpRemindersUseCase } = fastify.diContainer.cradle;
      await sendFollowUpRemindersUseCase.execute();
    } catch {
      // swallow — don't crash the server
    }
  };

  const timer = setInterval(run, INTERVAL_MS);
  fastify.addHook('onClose', () => {
    clearInterval(timer);
  });
});
