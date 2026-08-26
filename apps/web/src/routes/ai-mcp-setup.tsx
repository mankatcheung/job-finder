import { createFileRoute } from '@tanstack/react-router';
import { AiMcpSetupPage } from './-components/AiMcpSetupPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'Connect Your Own AI Key and an MCP Client — Trakwyn';
const DESCRIPTION =
  'Step-by-step: bring your own OpenAI, Anthropic, Google AI, or OpenRouter key for AI features, and connect an MCP client like Claude Desktop or Cursor to your Trakwyn data.';

export const Route = createFileRoute('/ai-mcp-setup')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/ai-mcp-setup` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/ai-mcp-setup` }],
  }),
  component: AiMcpSetupPage,
});
