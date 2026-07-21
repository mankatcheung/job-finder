import type { FastifyInstance } from 'fastify';

interface McpRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const TOOLS = [
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
];

function mcpText(data: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function mcpError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export default async function mcpPlugin(fastify: FastifyInstance) {
  fastify.post('/mcp', async (request, reply) => {
    // Authenticate via Bearer API token (both 'full' and 'read' scopes allowed)
    const authHeader = request.headers.authorization;
    const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!rawToken?.startsWith('jfat_')) {
      reply.code(401);
      return { error: 'Missing or invalid Authorization header' };
    }

    const { validateApiTokenUseCase } = (request as any).diScope.cradle;
    const authResult = await validateApiTokenUseCase.execute(rawToken).catch(() => null);
    if (!authResult) {
      reply.code(401);
      return { error: 'Invalid or expired API token' };
    }

    const userId = authResult.sub;
    const body = request.body as McpRequest;

    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      reply.code(400);
      return mcpError(body?.id ?? null, -32600, 'Invalid Request');
    }

    const { id, method, params } = body;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'job-finder-mcp', version: '1.0.0' },
        },
      };
    }

    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    }

    if (method === 'tools/call') {
      const toolName = (params as any)?.name as string;
      const args = ((params as any)?.arguments ?? {}) as Record<string, string>;
      const cradle = (request as any).diScope.cradle;

      try {
        let result: unknown;

        if (toolName === 'list_applications') {
          result = await cradle.getApplicationsUseCase.execute({
            userId,
            status: args.status,
          });
        } else if (toolName === 'get_application') {
          if (!args.applicationId) return mcpError(id, -32602, 'applicationId is required');
          result = await cradle.getApplicationUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
        } else if (toolName === 'list_notes') {
          if (!args.applicationId) return mcpError(id, -32602, 'applicationId is required');
          result = await cradle.getNotesUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
        } else if (toolName === 'list_contacts') {
          if (!args.applicationId) return mcpError(id, -32602, 'applicationId is required');
          result = await cradle.getContactsUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
        } else if (toolName === 'list_interview_rounds') {
          if (!args.applicationId) return mcpError(id, -32602, 'applicationId is required');
          result = await cradle.getInterviewRoundsUseCase.execute({
            applicationId: args.applicationId,
            userId,
          });
        } else {
          return mcpError(id, -32601, `Unknown tool: ${toolName}`);
        }

        return { jsonrpc: '2.0', id, result: mcpText(result) };
      } catch (err: any) {
        const isNotFound = err?.code === 'NOT_FOUND';
        const isForbidden = err?.code === 'FORBIDDEN';
        const code = isNotFound || isForbidden ? -32602 : -32603;
        return mcpError(id, code, err?.message ?? 'Internal error');
      }
    }

    return mcpError(id, -32601, `Method not found: ${method}`);
  });
}
