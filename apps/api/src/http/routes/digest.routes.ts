import type { RouteDefinition } from '@/http/ports/RouteDefinition.js';
import type { Cradle } from '@/http/container.js';
import { ENV, ROUTES } from '@/constants.js';
import { isAuthorizedCronTrigger } from '@/http/routes/cronAuth.js';

export function digestRoutes(getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      // GET so Vercel Cron (which only issues GET requests) can trigger this
      // directly; POST kept for manual/external triggering.
      method: ['GET', 'POST'],
      path: ROUTES.DIGEST_SEND,
      handler: async (req, res) => {
        if (!process.env[ENV.DIGEST_ADMIN_SECRET] && !process.env[ENV.CRON_SECRET]) {
          res
            .status(503)
            .send({ error: 'Digest not configured (DIGEST_ADMIN_SECRET/CRON_SECRET missing)' });
          return;
        }

        if (!isAuthorizedCronTrigger(req, ENV.DIGEST_ADMIN_SECRET)) {
          res.status(401).send({ error: 'Unauthorized' });
          return;
        }

        const { sendWeeklyDigestUseCase, logger } = getCradle();
        try {
          const summary = await sendWeeklyDigestUseCase.execute();
          res.send({ ok: true, summary });
        } catch (err) {
          logger.error('Weekly digest failed', err);
          res.status(500).send({ error: 'Digest failed' });
        }
      },
    },
  ];
}
