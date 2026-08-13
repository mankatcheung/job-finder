import type { SeedConversation } from '../types.js';

export const conversations: SeedConversation[] = [
  {
    title: 'Help me prepare for my Stripe interview',
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content:
          'I have a final round interview at Stripe next week for a Senior Engineer role. What should I focus on?',
      },
      {
        role: 'assistant',
        content:
          "Great question! For Stripe's final round, focus on these areas:\n\n1. **System Design** — payments systems are highly distributed. Be ready to discuss idempotency, exactly-once delivery, and handling partial failures.\n2. **Coding** — Stripe uses Ruby heavily, so expect algorithmic problems with a practical twist. Practice medium-to-hard LeetCode problems.\n3. **Stripe-specific knowledge** — understand how payment processing works: tokenization, PCI compliance, the difference between auth and capture.\n4. **Values interview** — Stripe cares deeply about user impact and meticulousness. Prepare stories about paying attention to detail and going above and beyond for users.\n\nWould you like me to walk through a mock system design problem?",
      },
      {
        role: 'user',
        content: "Yes, let's do a mock system design. How would you design a payment retry system?",
      },
      {
        role: 'assistant',
        content:
          "Here's a solid approach for a Payment Retry System:\n\n**Core Requirements:**\n- Retry failed payments (insufficient funds, network errors, card declined) without charging the customer twice\n- Support configurable retry schedules (e.g., retry in 1 day, 3 days, 7 days)\n- Notify the merchant and customer on final failure\n\n**Key Components:**\n1. **Retry Scheduler** — a job queue (e.g., SQS + DLQ) that schedules retry attempts with exponential backoff\n2. **Idempotency Layer** — each payment attempt gets a unique idempotency key; the payment provider API respects this to prevent double-charges\n3. **State Machine** — track payment status transitions: `pending → retrying → succeeded / permanently_failed`\n4. **Notification Service** — email/webhook on final failure so the merchant can take action\n\n**Edge Cases:**\n- What if the customer's card expires between retries? → Check card expiry before retrying\n- What about timezone issues with scheduled retries? → Store as UTC timestamps, schedule via a clock-independent queue\n- Rate limiting on the payment provider? → Implement circuit breaker pattern\n\nThis shows you understand distributed systems, payment domain knowledge, and edge-case thinking — all things Stripe values highly.",
      },
    ],
  },
  {
    title: 'Resume bullet points for my next application',
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content:
          "Can you help me rewrite my resume bullet points to be more impactful? Here's what I have:\n\n- Built a real-time notification system\n- Led migration from REST to GraphQL\n- Improved API response times",
      },
      {
        role: 'assistant',
        content:
          'Here are stronger versions using the STAR (Situation, Task, Action, Result) format:\n\n**Before → After:**\n\n1. *Built a real-time notification system* →\n   **"Architected a real-time notification system using WebSockets and Redis Pub/Sub, reducing notification delivery latency from 30s to <200ms and supporting 50K concurrent connections."**\n\n2. *Led migration from REST to GraphQL* →\n   **"Led a 3-month migration from REST to GraphQL (Pothos + Mercurius), eliminating 40% of over-fetching issues and reducing frontend API call volume by 60% across 12 microservices."**\n\n3. *Improved API response times* →\n   **"Optimized critical API endpoints by introducing response caching (Redis) and query optimization (Drizzle), reducing P95 latency from 1.2s to 180ms and saving $2.4K/month in compute costs."**\n\n**Key principles applied:**\n- Start with a strong action verb (Architected, Led, Optimized)\n- Include specific technologies (shows depth)\n- Quantify the impact (numbers make it concrete)\n- Mention scale (shows you can handle complexity)\n\nWould you like to work on any other bullet points?',
      },
    ],
  },
];
