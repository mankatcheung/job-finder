import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
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
import { ERROR_CODES, JSON_RPC_ERROR, MCP, PAGINATION } from '#src/constants.js';

/**
 * Tool arguments arrive straight off a JSON-RPC payload, so a numeric field
 * may show up as a number, a numeric string, or something unusable. Coerce
 * leniently and fall back to `undefined` for anything that isn't a positive
 * integer — the use case then applies its own default and clamps to
 * PAGINATION.MAX_LIMIT, so a bad value degrades to the default page rather
 * than erroring or being silently honoured.
 */
function toStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toPositiveInt(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** HTTP status for a malformed JSON-RPC envelope (matches Fastify `reply.code`). */
const HTTP_BAD_REQUEST = 400;

/** A single inbound JSON-RPC 2.0 message. */
export interface McpRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * The controller's response to the transport: a JSON-RPC `body` plus an
 * optional HTTP `status` override. Protocol-level errors (unknown method,
 * unknown tool) travel as normal `200` JSON-RPC error bodies; only a malformed
 * envelope maps to a non-200 status.
 */
export interface McpResult {
  status?: number;
  body: unknown;
}

interface Deps {
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

/** Advertised tool catalogue (returned verbatim by `tools/list`). */
export const MCP_TOOLS = [
  {
    name: 'list_applications',
    description:
      'List job applications for the authenticated user, newest first. Returns one page; pass the returned nextCursor to fetch the next.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (e.g. draft, applied, interviewing, offer, rejected)',
        },
        limit: {
          type: 'number',
          description: `Applications per page (1-${PAGINATION.MAX_LIMIT}, default ${PAGINATION.DEFAULT_LIMIT})`,
        },
        cursor: {
          type: 'string',
          description: 'nextCursor from a previous call, to fetch the following page',
        },
      },
    },
  },
  {
    name: 'get_application',
    description: 'Get a specific job application by ID',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_notes',
    description: 'List notes for a job application',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_contacts',
    description: 'List contacts associated with a job application',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_interview_rounds',
    description: 'List interview rounds for a job application',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_work_experiences',
    description: 'List all work experiences for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_educations',
    description: 'List all education entries for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_skills',
    description: 'List all skills for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_documents',
    description:
      'List documents (resumes, cover letters, offer letters) attached to a job application',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_offers',
    description: 'List offers received for a job application, including compensation details',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_activity',
    description:
      'List the activity/audit log for a job application — status changes and other events over time',
    inputSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The application ID' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_calendar_events',
    description:
      'List upcoming and past calendar events for the authenticated user — scheduled interviews and application follow-up dates',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_analytics',
    description:
      'Aggregate job-search statistics for the authenticated user: response times, which application channels perform best, interview-round progression, and offer figures. Use this for questions like "how is my search going?" — it returns compact summaries rather than raw records.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
] as const;

/**
 * Translates MCP JSON-RPC requests into use-case calls. This is the interface
 * adapter for the MCP transport — the equivalent of a GraphQL resolver, kept
 * out of the Fastify plugin so the plugin stays pure transport (auth + I/O).
 */
export class McpController {
  constructor(private readonly deps: Deps) {}

  async handle(rawBody: unknown, userId: string): Promise<McpResult> {
    const body = rawBody as McpRequest | null | undefined;

    if (!body || body.jsonrpc !== MCP.JSONRPC_VERSION || !body.method) {
      return {
        status: HTTP_BAD_REQUEST,
        body: this.error(body?.id ?? null, JSON_RPC_ERROR.INVALID_REQUEST, 'Invalid Request'),
      };
    }

    const { id, method, params } = body;

    if (method === 'initialize') {
      return {
        body: {
          jsonrpc: MCP.JSONRPC_VERSION,
          id,
          result: {
            protocolVersion: MCP.PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: MCP.SERVER_NAME, version: MCP.SERVER_VERSION },
          },
        },
      };
    }

    if (method === 'tools/list') {
      return { body: { jsonrpc: MCP.JSONRPC_VERSION, id, result: { tools: MCP_TOOLS } } };
    }

    if (method === 'tools/call') {
      return { body: await this.callTool(id, params, userId) };
    }

    return { body: this.error(id, JSON_RPC_ERROR.METHOD_NOT_FOUND, `Method not found: ${method}`) };
  }

  private async callTool(
    id: McpRequest['id'],
    params: McpRequest['params'],
    userId: string,
  ): Promise<unknown> {
    const toolName = (params as { name?: string } | undefined)?.name;
    // Not Record<string, string>: JSON-RPC arguments are arbitrary JSON, and
    // `limit` legitimately arrives as a number. Narrow per field below.
    const args = (params as { arguments?: Record<string, unknown> } | undefined)?.arguments ?? {};

    try {
      let result: unknown;

      switch (toolName) {
        case 'list_applications':
          result = await this.deps.getApplicationsPageUseCase.execute({
            userId,
            status: toStr(args.status) as ApplicationStatus | undefined,
            cursor: toStr(args.cursor),
            limit: toPositiveInt(args.limit),
          });
          break;
        case 'get_application':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getApplicationUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_notes':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getNotesUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_contacts':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getContactsUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_interview_rounds':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getInterviewRoundsUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_work_experiences':
          result = await this.deps.workExperienceRepository.findAllByUserId(userId);
          break;
        case 'list_educations':
          result = await this.deps.educationRepository.findAllByUserId(userId);
          break;
        case 'list_skills':
          result = await this.deps.skillRepository.findAllByUserId(userId);
          break;
        case 'list_documents':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getDocumentsUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_offers':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getOffersUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_activity':
          if (!toStr(args.applicationId)) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getActivityLogsUseCase.execute({
            applicationId: toStr(args.applicationId)!,
            userId,
          });
          break;
        case 'list_calendar_events':
          result = await this.deps.getCalendarEventsUseCase.execute({ userId });
          break;
        case 'get_analytics': {
          // Fetched together: each is a compact aggregate, and "how is my
          // search going?" wants all four. Splitting into four tools would
          // cost more in advertised schema than it saves in payload.
          const [responseTime, channels, interviewRounds, offers] = await Promise.all([
            this.deps.getResponseTimeAnalyticsUseCase.execute({ userId }),
            this.deps.getApplicationChannelAnalyticsUseCase.execute({ userId }),
            this.deps.getInterviewRoundAnalyticsUseCase.execute({ userId }),
            this.deps.getOfferAnalyticsUseCase.execute({ userId }),
          ]);
          result = { responseTime, channels, interviewRounds, offers };
          break;
        }
        default:
          return this.error(id, JSON_RPC_ERROR.METHOD_NOT_FOUND, `Unknown tool: ${toolName}`);
      }

      return { jsonrpc: MCP.JSONRPC_VERSION, id, result: this.text(result) };
    } catch (err) {
      const code = (err as { code?: string }).code;
      const message = err instanceof Error ? err.message : 'Internal error';
      const isClientError = code === ERROR_CODES.NOT_FOUND || code === ERROR_CODES.FORBIDDEN;
      const rpcCode = isClientError ? JSON_RPC_ERROR.INVALID_PARAMS : JSON_RPC_ERROR.INTERNAL_ERROR;
      return this.error(id, rpcCode, message);
    }
  }

  private text(data: unknown) {
    // Compact, not pretty-printed: this goes straight into an LLM's context
    // window, where two-space indentation on every line of a page of results
    // is pure token cost with no reader to benefit from it.
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }

  private error(id: McpRequest['id'], code: number, message: string) {
    return { jsonrpc: MCP.JSONRPC_VERSION, id, error: { code, message } };
  }
}
