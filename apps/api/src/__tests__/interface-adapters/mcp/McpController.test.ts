import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpController, MCP_TOOLS } from '@/interface-adapters/mcp/McpController.js';
import { ERROR_CODES, JSON_RPC_ERROR, MCP } from '@/constants.js';
import type { IGetApplicationsUseCase } from '@/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationUseCase } from '@/use-cases/jobs/IGetApplicationUseCase.js';
import type { IGetNotesUseCase } from '@/use-cases/notes/IGetNotesUseCase.js';
import type { IGetContactsUseCase } from '@/use-cases/contacts/IGetContactsUseCase.js';
import type { IGetInterviewRoundsUseCase } from '@/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';

const USER_ID = 'user-1';

const makeDeps = () => ({
  getApplicationsUseCase: { execute: vi.fn() } as IGetApplicationsUseCase,
  getApplicationUseCase: { execute: vi.fn() } as IGetApplicationUseCase,
  getNotesUseCase: { execute: vi.fn() } as IGetNotesUseCase,
  getContactsUseCase: { execute: vi.fn() } as IGetContactsUseCase,
  getInterviewRoundsUseCase: { execute: vi.fn() } as IGetInterviewRoundsUseCase,
});

const rpc = (method: string, params?: Record<string, unknown>, id: string | number = 1) => ({
  jsonrpc: '2.0',
  id,
  method,
  ...(params ? { params } : {}),
});

describe('McpController', () => {
  let deps: ReturnType<typeof makeDeps>;
  let controller: McpController;

  beforeEach(() => {
    vi.clearAllMocks();
    deps = makeDeps();
    controller = new McpController(deps);
  });

  describe('envelope validation', () => {
    it('rejects a malformed envelope with HTTP 400 and an INVALID_REQUEST error', async () => {
      const { status, body } = await controller.handle({ id: 9, method: 'initialize' }, USER_ID);

      expect(status).toBe(400);
      expect(body).toMatchObject({
        jsonrpc: MCP.JSONRPC_VERSION,
        id: 9,
        error: { code: JSON_RPC_ERROR.INVALID_REQUEST, message: 'Invalid Request' },
      });
    });

    it('defaults the error id to null when the body has none', async () => {
      const { body } = await controller.handle(undefined, USER_ID);
      expect(body).toMatchObject({ id: null });
    });
  });

  describe('initialize', () => {
    it('returns protocol version and server info', async () => {
      const { status, body } = await controller.handle(rpc('initialize'), USER_ID);

      expect(status).toBeUndefined();
      expect(body).toMatchObject({
        jsonrpc: MCP.JSONRPC_VERSION,
        id: 1,
        result: {
          protocolVersion: MCP.PROTOCOL_VERSION,
          serverInfo: { name: MCP.SERVER_NAME, version: MCP.SERVER_VERSION },
        },
      });
    });
  });

  describe('tools/list', () => {
    it('returns the advertised tool catalogue', async () => {
      const { body } = await controller.handle(rpc('tools/list'), USER_ID);
      expect(body).toMatchObject({ result: { tools: MCP_TOOLS } });
    });
  });

  describe('unknown method', () => {
    it('returns METHOD_NOT_FOUND with a 200 status', async () => {
      const { status, body } = await controller.handle(rpc('does/not/exist'), USER_ID);

      expect(status).toBeUndefined();
      expect(body).toMatchObject({
        error: { code: JSON_RPC_ERROR.METHOD_NOT_FOUND },
      });
    });
  });

  describe('tools/call', () => {
    it('calls list_applications scoped to the user and wraps the result as text', async () => {
      const apps = [{ id: 'a1' }];
      vi.mocked(deps.getApplicationsUseCase.execute).mockResolvedValue(apps as never);

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_applications', arguments: { status: 'applied' } }),
        USER_ID,
      );

      expect(deps.getApplicationsUseCase.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        status: 'applied',
      });
      expect(body).toMatchObject({
        result: { content: [{ type: 'text', text: JSON.stringify(apps, null, 2) }] },
      });
    });

    it('requires applicationId for get_application', async () => {
      const { body } = await controller.handle(
        rpc('tools/call', { name: 'get_application', arguments: {} }),
        USER_ID,
      );

      expect(deps.getApplicationUseCase.execute).not.toHaveBeenCalled();
      expect(body).toMatchObject({
        error: { code: JSON_RPC_ERROR.INVALID_PARAMS, message: 'applicationId is required' },
      });
    });

    it('passes applicationId and userId through to get_application', async () => {
      vi.mocked(deps.getApplicationUseCase.execute).mockResolvedValue({ id: 'a1' } as never);

      await controller.handle(
        rpc('tools/call', { name: 'get_application', arguments: { applicationId: 'a1' } }),
        USER_ID,
      );

      expect(deps.getApplicationUseCase.execute).toHaveBeenCalledWith({
        applicationId: 'a1',
        userId: USER_ID,
      });
    });

    it('returns METHOD_NOT_FOUND for an unknown tool', async () => {
      const { body } = await controller.handle(
        rpc('tools/call', { name: 'nope', arguments: {} }),
        USER_ID,
      );

      expect(body).toMatchObject({
        error: { code: JSON_RPC_ERROR.METHOD_NOT_FOUND, message: 'Unknown tool: nope' },
      });
    });

    it('maps a NOT_FOUND use-case error to INVALID_PARAMS', async () => {
      const err = Object.assign(new Error('Application not found'), {
        code: ERROR_CODES.NOT_FOUND,
      });
      vi.mocked(deps.getApplicationUseCase.execute).mockRejectedValue(err);

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'get_application', arguments: { applicationId: 'missing' } }),
        USER_ID,
      );

      expect(body).toMatchObject({
        error: { code: JSON_RPC_ERROR.INVALID_PARAMS, message: 'Application not found' },
      });
    });

    it('maps an unexpected use-case error to INTERNAL_ERROR', async () => {
      vi.mocked(deps.getNotesUseCase.execute).mockRejectedValue(new Error('boom'));

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_notes', arguments: { applicationId: 'a1' } }),
        USER_ID,
      );

      expect(body).toMatchObject({
        error: { code: JSON_RPC_ERROR.INTERNAL_ERROR, message: 'boom' },
      });
    });
  });
});
