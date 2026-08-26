import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type { User } from '#src/domain/user/User.js';
import type { Message } from '#src/domain/message/Message.js';
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
import type { LLMMessage, LLMToolCall } from '#src/use-cases/ports/ILLMProvider.js';
import { CHAT } from '#src/constants.js';

/**
 * Shared between `ChatWithAssistantUseCase` (non-streaming) and
 * `StreamChatWithAssistantUseCase` (JEF-239) — both offer the model the same
 * tool catalogue and dispatch calls to it identically, so the dispatch
 * switch lives here once instead of being duplicated per use case.
 */
export const CHAT_SYSTEM_PROMPT = `You are a helpful assistant inside a job application tracker. Answer the user's questions about their job applications, contacts, interview rounds, and professional background using the available tools — never guess at data you haven't fetched. Be concise; summarize lists rather than dumping raw data. Questions about notes, contacts, or interview rounds are scoped to one application, so first find its id with list_applications if you don't already have it. You can also look up the user's work experience, education, and skills to help with cover letters, interview prep, or career advice, their documents, offers, activity history and calendar, and get_analytics for aggregate stats about how their search is going. list_applications returns one page at a time as {items, hasNextPage, nextCursor} — read items, and if you need more than the first page, call it again passing cursor: nextCursor. Do not assume the first page is everything when hasNextPage is true.`;

export interface ChatToolDeps {
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
}

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

export async function executeChatTool(
  call: LLMToolCall,
  userId: string,
  deps: ChatToolDeps,
): Promise<unknown> {
  const args = call.arguments;
  const applicationId = String(args.applicationId ?? '');

  try {
    switch (call.name) {
      case 'list_applications':
        return await deps.getApplicationsPageUseCase.execute({
          userId,
          status: args.status as ApplicationStatus | undefined,
          cursor: typeof args.cursor === 'string' ? args.cursor : undefined,
          limit: toPositiveInt(args.limit),
        });
      case 'get_application':
        return await deps.getApplicationUseCase.execute({ userId, applicationId });
      case 'list_notes':
        return await deps.getNotesUseCase.execute({ userId, applicationId });
      case 'list_contacts':
        return await deps.getContactsUseCase.execute({ userId, applicationId });
      case 'list_interview_rounds':
        return await deps.getInterviewRoundsUseCase.execute({ userId, applicationId });
      case 'list_work_experiences':
        return await deps.workExperienceRepository.findAllByUserId(userId);
      case 'list_educations':
        return await deps.educationRepository.findAllByUserId(userId);
      case 'list_skills':
        return await deps.skillRepository.findAllByUserId(userId);
      case 'list_documents':
        return await deps.getDocumentsUseCase.execute({ userId, applicationId });
      case 'list_offers':
        return await deps.getOffersUseCase.execute({ userId, applicationId });
      case 'list_activity':
        return await deps.getActivityLogsUseCase.execute({ userId, applicationId });
      case 'list_calendar_events':
        return await deps.getCalendarEventsUseCase.execute({ userId });
      case 'get_analytics': {
        const [responseTime, channels, interviewRounds, offers] = await Promise.all([
          deps.getResponseTimeAnalyticsUseCase.execute({ userId }),
          deps.getApplicationChannelAnalyticsUseCase.execute({ userId }),
          deps.getInterviewRoundAnalyticsUseCase.execute({ userId }),
          deps.getOfferAnalyticsUseCase.execute({ userId }),
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

/**
 * Builds the LLM prompt for a new turn: system prompt (marked as a cache
 * breakpoint — see `CHAT_SYSTEM_PROMPT`'s usage), the user's optional custom
 * AI prompt, stored history, and the new message.
 */
export function buildChatMessages(
  history: Message[],
  newMessage: string,
  user: User | null,
): LLMMessage[] {
  return [
    { role: 'system', content: CHAT_SYSTEM_PROMPT, cacheBreakpoint: true },
    ...(user?.customAiPrompt
      ? [{ role: 'system', content: user.customAiPrompt } as LLMMessage]
      : []),
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage },
  ];
}

export function deriveChatTitle(message: string): string {
  const trimmed = message.trim();
  return trimmed.length > CHAT.TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, CHAT.TITLE_MAX_LENGTH).trimEnd()}…`
    : trimmed;
}
