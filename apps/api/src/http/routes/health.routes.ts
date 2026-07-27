import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import { ROUTES } from '#src/constants.js';

export function healthRoutes(): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: ROUTES.HEALTH,
      handler: async (_req, res) => {
        res.send({ status: 'ok' });
      },
    },
  ];
}
