import type { RouteDefinition } from '@/http/ports/RouteDefinition.js';
import type { Cradle } from '@/http/container.js';
import { ENV, ROUTES } from '@/constants.js';
import { isAuthorizedCronTrigger } from '@/http/routes/cronAuth.js';

/**
 * Was an in-process setInterval poll; converted to an external-trigger route
 * (mirrors digest.routes.ts) because a setInterval can't survive Vercel's
 * serverless model — the process doesn't stay alive between requests, so
 * nothing would ever fire it. Driven by Vercel Cron in production.
 */
export function remindersRoutes(getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      method: ['GET', 'POST'],
      path: ROUTES.REMINDERS_SEND,
      handler: async (req, res) => {
        if (!process.env[ENV.CRON_SECRET]) {
          res.status(503).send({ error: 'Reminders not configured (CRON_SECRET missing)' });
          return;
        }

        if (!isAuthorizedCronTrigger(req, ENV.CRON_SECRET)) {
          res.status(401).send({ error: 'Unauthorized' });
          return;
        }

        const { sendFollowUpRemindersUseCase, logger } = getCradle();
        try {
          await sendFollowUpRemindersUseCase.execute();
          res.send({ ok: true });
        } catch (err) {
          logger.error('Follow-up reminders failed', err);
          res.status(500).send({ error: 'Reminders failed' });
        }
      },
    },
  ];
}
