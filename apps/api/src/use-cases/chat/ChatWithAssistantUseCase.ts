import {
  AiNotConfiguredError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
} from '#src/use-cases/errors/DomainError.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { User } from '#src/domain/user/User.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IGetApplicationsPageUseCase } from '#src/use-cases/jobs/IGetApplicationsPageUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IGetContactsUseCase } from '#src/use-cases/contacts/IGetContactsUseCase.js';
import type { IGetInterviewRoundsUseCase } from '#src/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import type { IGetDocumentsUseCase } from '#src/use-cases/documents/IGetDocumentsUseCase.js';
import type { IGetOffersUseCase } from '#src/use-cases/offers/IGetOffersUseCase.js';
import type { IGetActivityLogsUseCase } from '#src/use-cases/activityLogs/IGetActivityLogsUseCase.js';
import type { GetCalendarEventsUseCase } from '#src/use-cases/calendar/GetCalendarEventsUseCase.js';
import type { GetResponseTimeAnalyticsUseCase } from '#src/use-cases/activityLogs/GetResponseTimeAnalyticsUseCase.js';
import type { GetApplicationChannelAnalyticsUseCase } from '#src/use-cases/application/GetApplicationChannelAnalyticsUseCase.js';
import type { GetInterviewRoundAnalyticsUseCase } from '#src/use-cases/interviewRounds/GetInterviewRoundAnalyticsUseCase.js';
import type { GetOfferAnalyticsUseCase } from '#src/use-cases/offers/GetOfferAnalyticsUseCase.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type {
  LLMMessage,
  LLMToolCall,
  LLMToolDefinition,
} from '#src/use-cases/ports/ILLMProvider.js';
import { CHAT } from '#src/constants.js';

export interface ChatWithAssistantInput {
  userId: string;
  conversationId: string;
  message: string;
  /**
   * Aborted when the client disconnects before a reply arrives (JEF-240) —
   * threaded down to the LLM provider fetch so a cancelled generation stops
   * costing tokens server-side instead of running to completion for no one.
   * Tool execution itself isn't cancelled (cheap DB reads, not the expense
   * this exists to avoid) — only the LLM call.
   */
  signal?: AbortSignal;
}

interface Deps {
  /**
   * The tools this surface offers the model, injected rather than imported:
   * the catalogue is an adapter-layer contract, and which subset chat gets
   * is a composition decision (see `http/di`) — chat is session-authenticated
   * with no token scope, so it receives read tools only (JEF-177).
   */
  chatTools: LLMToolDefinition[];
  llmProviderFactory: ILLMProviderFactory;
  getApplicationsPageUseCase: IGetApplicationsPageUseCase;
  getApplicationUseCase: IGetApplicationUseCase;
  getNotesUseCase: IGetNotesUseCase;
  getContactsUseCase: IGetContactsUseCase;
  getInterviewRoundsUseCase: IGetInterviewRoundsUseCase;
  getDocumentsUseCase: IGetDocumentsUseCase;
  getOffersUseCase: IGetOffersUseCase;
  getActivityLogsUseCase: IGetActivityLogsUseCase;
  getCalendarEventsUseCase: GetCalendarEventsUseCase;
  getResponseTimeAnalyticsUseCase: GetResponseTimeAnalyticsUseCase;
  getApplicationChannelAnalyticsUseCase: GetApplicationChannelAnalyticsUseCase;
  getInterviewRoundAnalyticsUseCase: GetInterviewRoundAnalyticsUseCase;
  getOfferAnalyticsUseCase: GetOfferAnalyticsUseCase;
  workExperienceRepository: IWorkExperienceRepository;
  educationRepository: IEducationRepository;
  skillRepository: ISkillRepository;
  chatRateLimiter: IRateLimiter;
  messageRepository: IMessageRepository;
  conversationRepository: IConversationRepository;
  userRepository: IUserRepository;
  generateId: () => string;
}

const SYSTEM_PROMPT = `You are a helpful assistant inside a job application tracker. Answer the user's questions about their job applications, contacts, interview rounds, and professional background using the available tools — never guess at data you haven't fetched. Be concise; summarize lists rather than dumping raw data. Questions about notes, contacts, or interview rounds are scoped to one application, so first find its id with list_applications if you don't already have it. You can also look up the user's work experience, education, and skills to help with cover letters, interview prep, or career advice, their documents, offers, activity history and calendar, and get_analytics for aggregate stats about how their search is going. list_applications returns one page at a time as {items, hasNextPage, nextCursor} — read items, and if you need more than the first page, call it again passing cursor: nextCursor. Do not assume the first page is everything when hasNextPage is true.`;

// The system prompt and tool catalogue are identical on every chat request
// from every user, so they're marked as a cache breakpoint: Anthropic (the
// only provider requiring an explicit opt-in) caches the static prefix up to
// and including the marked block, and reuses it across both same-turn tool
// round-trips and later turns/users instead of reprocessing it every call.
/**
 * Tool arguments come from the model, so a numeric field may arrive as a
 * number, a numeric string, or nonsense. Anything that isn't a positive
 * integer falls back to undefined, letting the use case apply its own
 * default and clamp — a bad value degrades to the default page rather than
 * erroring mid-conversation.
 */
function toPositiveInt(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export class ChatWithAssistantUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ChatWithAssistantInput): Promise<string> {
    if (!(await this.deps.chatRateLimiter.consume(`chat:${input.userId}`))) {
      throw new RateLimitedError('Too many messages — please wait a moment and try again');
    }

    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    // Fetched once up front: needed both for the custom-AI-prompt system
    // message below and as the defaultLlmProvider fallback inside complete().
    const user = await this.deps.userRepository.findById(input.userId);

    // Stored history only ever contains 'user'/'assistant' turns we wrote
    // ourselves — the per-turn tool-call scratchpad below is rebuilt fresh
    // each time and never persisted.
    const history = await this.deps.messageRepository.findAllByConversationId(input.conversationId);

    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT, cacheBreakpoint: true },
      ...(user?.customAiPrompt
        ? [{ role: 'system', content: user.customAiPrompt } as LLMMessage]
        : []),
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: input.message },
    ];

    const reply = await this.complete(messages, input.userId, conversation, user, input.signal);

    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      conversationId: input.conversationId,
      role: 'user',
      content: input.message,
    });
    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      conversationId: input.conversationId,
      role: 'assistant',
      content: reply,
    });

    if (history.length === 0) {
      await this.deps.conversationRepository.updateTitle(
        input.conversationId,
        this.deriveTitle(input.message),
      );
    }

    return reply;
  }

  private deriveTitle(message: string): string {
    const trimmed = message.trim();
    return trimmed.length > CHAT.TITLE_MAX_LENGTH
      ? `${trimmed.slice(0, CHAT.TITLE_MAX_LENGTH).trimEnd()}…`
      : trimmed;
  }

  private async complete(
    messages: LLMMessage[],
    userId: string,
    conversation: Conversation,
    user: User | null,
    signal?: AbortSignal,
  ): Promise<string> {
    const providerName = conversation.llmProvider ?? user?.defaultLlmProvider ?? null;

    const llmProvider = await this.deps.llmProviderFactory.forUser(
      userId,
      providerName ?? undefined,
      conversation.llmModel,
    );
    if (!llmProvider) {
      throw new AiNotConfiguredError('Add your AI API key in Settings to use this feature');
    }

    if (!conversation.llmProvider && providerName) {
      await this.deps.conversationRepository.updateLlmSettings(
        conversation.id,
        providerName,
        conversation.llmModel,
      );
    }

    for (let i = 0; i < CHAT.MAX_TOOL_ITERATIONS; i++) {
      const result = await llmProvider.completeWithTools(
        messages,
        this.deps.chatTools,
        undefined,
        signal,
      );

      if (result.toolCalls.length === 0) {
        return result.content?.trim() || "I don't have a response for that.";
      }

      messages.push({
        role: 'assistant',
        content: result.content ?? '',
        toolCalls: result.toolCalls,
      });

      const toolResults = await Promise.all(
        result.toolCalls.map((call) => this.executeTool(call, userId)),
      );
      result.toolCalls.forEach((call, i) => {
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResults[i]),
          toolCallId: call.id,
        });
      });
    }

    return 'That took more steps than I could complete — try asking something more specific.';
  }

  private async executeTool(call: LLMToolCall, userId: string): Promise<unknown> {
    const args = call.arguments;
    const applicationId = String(args.applicationId ?? '');

    try {
      switch (call.name) {
        case 'list_applications':
          return await this.deps.getApplicationsPageUseCase.execute({
            userId,
            status: args.status as ApplicationStatus | undefined,
            cursor: typeof args.cursor === 'string' ? args.cursor : undefined,
            limit: toPositiveInt(args.limit),
          });
        case 'get_application':
          return await this.deps.getApplicationUseCase.execute({ userId, applicationId });
        case 'list_notes':
          return await this.deps.getNotesUseCase.execute({ userId, applicationId });
        case 'list_contacts':
          return await this.deps.getContactsUseCase.execute({ userId, applicationId });
        case 'list_interview_rounds':
          return await this.deps.getInterviewRoundsUseCase.execute({ userId, applicationId });
        case 'list_work_experiences':
          return await this.deps.workExperienceRepository.findAllByUserId(userId);
        case 'list_educations':
          return await this.deps.educationRepository.findAllByUserId(userId);
        case 'list_skills':
          return await this.deps.skillRepository.findAllByUserId(userId);
        case 'list_documents':
          return await this.deps.getDocumentsUseCase.execute({ userId, applicationId });
        case 'list_offers':
          return await this.deps.getOffersUseCase.execute({ userId, applicationId });
        case 'list_activity':
          return await this.deps.getActivityLogsUseCase.execute({ userId, applicationId });
        case 'list_calendar_events':
          return await this.deps.getCalendarEventsUseCase.execute({ userId });
        case 'get_analytics': {
          const [responseTime, channels, interviewRounds, offers] = await Promise.all([
            this.deps.getResponseTimeAnalyticsUseCase.execute({ userId }),
            this.deps.getApplicationChannelAnalyticsUseCase.execute({ userId }),
            this.deps.getInterviewRoundAnalyticsUseCase.execute({ userId }),
            this.deps.getOfferAnalyticsUseCase.execute({ userId }),
          ]);
          return { responseTime, channels, interviewRounds, offers };
        }
        default:
          return { error: `Unknown tool: ${call.name}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Tool call failed' };
    }
  }
}
