import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type { IGetApplicationsUseCase } from '#src/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IGetContactsUseCase } from '#src/use-cases/contacts/IGetContactsUseCase.js';
import type { IGetInterviewRoundsUseCase } from '#src/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import { ERROR_CODES, JSON_RPC_ERROR, MCP } from '#src/constants.js';

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
  getApplicationsUseCase: IGetApplicationsUseCase;
  getApplicationUseCase: IGetApplicationUseCase;
  getNotesUseCase: IGetNotesUseCase;
  getContactsUseCase: IGetContactsUseCase;
  getInterviewRoundsUseCase: IGetInterviewRoundsUseCase;
  workExperienceRepository: IWorkExperienceRepository;
  educationRepository: IEducationRepository;
  skillRepository: ISkillRepository;
}

/** Advertised tool catalogue (returned verbatim by `tools/list`). */
export const MCP_TOOLS = [
  {
    name: 'list_applications',
    description: 'List all job applications for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (e.g. draft, applied, interviewing, offer, rejected)',
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
    const args = (params as { arguments?: Record<string, string> } | undefined)?.arguments ?? {};

    try {
      let result: unknown;

      switch (toolName) {
        case 'list_applications':
          result = await this.deps.getApplicationsUseCase.execute({
            userId,
            status: args.status as ApplicationStatus | undefined,
          });
          break;
        case 'get_application':
          if (!args.applicationId) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getApplicationUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
          break;
        case 'list_notes':
          if (!args.applicationId) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getNotesUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
          break;
        case 'list_contacts':
          if (!args.applicationId) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getContactsUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
          break;
        case 'list_interview_rounds':
          if (!args.applicationId) {
            return this.error(id, JSON_RPC_ERROR.INVALID_PARAMS, 'applicationId is required');
          }
          result = await this.deps.getInterviewRoundsUseCase.execute({
            applicationId: args.applicationId,
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
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }

  private error(id: McpRequest['id'], code: number, message: string) {
    return { jsonrpc: MCP.JSONRPC_VERSION, id, error: { code, message } };
  }
}
