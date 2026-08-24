import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import { ROUTES } from '#src/constants.js';

/**
 * A same-origin stand-in for a real OpenAI-compatible `/chat/completions`
 * endpoint, registered only when `LLM_PROVIDER_MODE=fake`. Not a new
 * provider type on the backend or a new option in Settings → AI's provider
 * dropdown — an e2e test (or a developer) points the existing "Custom
 * (OpenAI-compatible)" provider's own base URL here, the same real mechanism
 * self-hosted/OpenAI-compatible endpoints already use in production.
 *
 * Two canned response shapes, chosen by whether the request carries `tools`:
 * present means a chat request (ChatWithAssistantUseCase's
 * `completeWithTools`) — replies with plain text and no tool calls, which
 * ends the tool-use loop after one round. Absent means a `complete()` call —
 * currently only GenerateResumeUseCase, which requires strict JSON matching
 * its schema and grounds every company/institution against the user's own
 * stored profile, so the canned resume below only works together with a test
 * that creates matching work-experience/education fixtures first.
 */
export function fakeLlmCompletionsRoutes(): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: ROUTES.LLM_FAKE_COMPLETIONS,
      handler: async (req, res) => {
        const body = req.body as { tools?: unknown } | undefined;
        const content = body?.tools
          ? 'Fake assistant reply for e2e testing.'
          : JSON.stringify({
              summary: 'Experienced engineer.',
              experience: [
                {
                  company: 'Acme Corp',
                  title: 'Senior Engineer',
                  period: '2020 - Present',
                  bullets: ['Built things.'],
                },
              ],
              education: [
                {
                  institution: 'State University',
                  qualification: 'BS Computer Science',
                  period: '2016 - 2020',
                },
              ],
              skills: [{ category: 'Languages', items: ['TypeScript'] }],
            });

        res.send({ choices: [{ message: { content, tool_calls: [] } }] });
      },
    },
  ];
}
