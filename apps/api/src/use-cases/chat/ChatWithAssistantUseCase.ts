import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IGetApplicationsUseCase } from '#src/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IGetContactsUseCase } from '#src/use-cases/contacts/IGetContactsUseCase.js';
import type { IGetInterviewRoundsUseCase } from '#src/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type {
  LLMMessage,
  LLMToolCall,
  LLMToolDefinition,
} from '#src/use-cases/ports/ILLMProvider.js';
import { MCP_TOOLS } from '#src/interface-adapters/mcp/McpController.js';
import { CHAT, ERROR_CODES } from '#src/constants.js';

export interface ChatWithAssistantInput {
  userId: string;
  message: string;
}

interface Deps {
  llmProviderFactory: ILLMProviderFactory;
  getApplicationsUseCase: IGetApplicationsUseCase;
  getApplicationUseCase: IGetApplicationUseCase;
  getNotesUseCase: IGetNotesUseCase;
  getContactsUseCase: IGetContactsUseCase;
  getInterviewRoundsUseCase: IGetInterviewRoundsUseCase;
  chatRateLimiter: IRateLimiter;
  messageRepository: IMessageRepository;
  generateId: () => string;
}

const SYSTEM_PROMPT = `You are a helpful assistant inside a job application tracker. Answer the user's questions about their job applications, contacts, and interview rounds using the available tools — never guess at data you haven't fetched. Be concise; summarize lists rather than dumping raw data. Questions about notes, contacts, or interview rounds are scoped to one application, so first find its id with list_applications if you don't already have it.`;

const TOOLS: LLMToolDefinition[] = MCP_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  parameters: t.inputSchema,
}));

export class ChatWithAssistantUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ChatWithAssistantInput): Promise<string> {
    if (!this.deps.chatRateLimiter.consume(`chat:${input.userId}`)) {
      throw Object.assign(new Error('Too many messages — please wait a moment and try again'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    // Stored history only ever contains 'user'/'assistant' turns we wrote
    // ourselves — the per-turn tool-call scratchpad below is rebuilt fresh
    // each time and never persisted.
    const history = await this.deps.messageRepository.findAllByUserId(input.userId);

    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: input.message },
    ];

    const reply = await this.complete(messages, input.userId);

    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      role: 'user',
      content: input.message,
    });
    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      role: 'assistant',
      content: reply,
    });

    return reply;
  }

  private async complete(messages: LLMMessage[], userId: string): Promise<string> {
    const llmProvider = await this.deps.llmProviderFactory.forUser(userId);
    if (!llmProvider) {
      throw Object.assign(new Error('Add your AI API key in Settings to use this feature'), {
        code: ERROR_CODES.AI_NOT_CONFIGURED,
      });
    }

    for (let i = 0; i < CHAT.MAX_TOOL_ITERATIONS; i++) {
      const result = await llmProvider.completeWithTools(messages, TOOLS);

      if (result.toolCalls.length === 0) {
        return result.content?.trim() || "I don't have a response for that.";
      }

      messages.push({
        role: 'assistant',
        content: result.content ?? '',
        toolCalls: result.toolCalls,
      });

      for (const call of result.toolCalls) {
        const toolResult = await this.executeTool(call, userId);
        messages.push({ role: 'tool', content: JSON.stringify(toolResult), toolCallId: call.id });
      }
    }

    return 'That took more steps than I could complete — try asking something more specific.';
  }

  private async executeTool(call: LLMToolCall, userId: string): Promise<unknown> {
    const args = call.arguments;
    const applicationId = String(args.applicationId ?? '');

    try {
      switch (call.name) {
        case 'list_applications':
          return await this.deps.getApplicationsUseCase.execute({
            userId,
            status: args.status as ApplicationStatus | undefined,
          });
        case 'get_application':
          return await this.deps.getApplicationUseCase.execute({ userId, applicationId });
        case 'list_notes':
          return await this.deps.getNotesUseCase.execute({ userId, applicationId });
        case 'list_contacts':
          return await this.deps.getContactsUseCase.execute({ userId, applicationId });
        case 'list_interview_rounds':
          return await this.deps.getInterviewRoundsUseCase.execute({ userId, applicationId });
        default:
          return { error: `Unknown tool: ${call.name}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Tool call failed' };
    }
  }
}
