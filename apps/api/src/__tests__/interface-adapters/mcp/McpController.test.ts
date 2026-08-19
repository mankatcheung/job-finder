import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpController, MCP_TOOLS } from '#src/interface-adapters/mcp/McpController.js';
import { ERROR_CODES, JSON_RPC_ERROR, MCP } from '#src/constants.js';
import type { IGetApplicationsPageUseCase } from '#src/use-cases/jobs/IGetApplicationsPageUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IGetContactsUseCase } from '#src/use-cases/contacts/IGetContactsUseCase.js';
import type { IGetInterviewRoundsUseCase } from '#src/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import {
  makeWorkExperienceRepository,
  makeEducationRepository,
  makeSkillRepository,
} from '#src/__tests__/helpers/mocks.js';

const USER_ID = 'user-1';

const makeDeps = () => ({
  getApplicationsPageUseCase: { execute: vi.fn() } as IGetApplicationsPageUseCase,
  getApplicationUseCase: { execute: vi.fn() } as IGetApplicationUseCase,
  getNotesUseCase: { execute: vi.fn() } as IGetNotesUseCase,
  getContactsUseCase: { execute: vi.fn() } as IGetContactsUseCase,
  getInterviewRoundsUseCase: { execute: vi.fn() } as IGetInterviewRoundsUseCase,
  workExperienceRepository: makeWorkExperienceRepository(),
  educationRepository: makeEducationRepository(),
  skillRepository: makeSkillRepository(),
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
    it('calls list_applications scoped to the user and wraps the result as compact text', async () => {
      const page = { items: [{ id: 'a1' }], hasNextPage: false, nextCursor: null };
      vi.mocked(deps.getApplicationsPageUseCase.execute).mockResolvedValue(page as never);

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_applications', arguments: { status: 'applied' } }),
        USER_ID,
      );

      expect(deps.getApplicationsPageUseCase.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        status: 'applied',
        cursor: undefined,
        limit: undefined,
      });
      // Compact, not pretty-printed — this lands in an LLM context window.
      expect(body).toMatchObject({
        result: { content: [{ type: 'text', text: JSON.stringify(page) }] },
      });
    });

    describe('list_applications pagination (JEF-172)', () => {
      beforeEach(() => {
        vi.mocked(deps.getApplicationsPageUseCase.execute).mockResolvedValue({
          items: [],
          hasNextPage: false,
          nextCursor: null,
        } as never);
      });

      it('passes limit and cursor through to the paginated use case', async () => {
        await controller.handle(
          rpc('tools/call', {
            name: 'list_applications',
            arguments: { limit: 5, cursor: 'app-42' },
          }),
          USER_ID,
        );

        expect(deps.getApplicationsPageUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 5, cursor: 'app-42' }),
        );
      });

      it('accepts a numeric string limit, since JSON-RPC arguments are untyped', async () => {
        await controller.handle(
          rpc('tools/call', { name: 'list_applications', arguments: { limit: '5' } }),
          USER_ID,
        );

        expect(deps.getApplicationsPageUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 5 }),
        );
      });

      it.each([['abc'], [0], [-1], [2.5], [null]])(
        'falls back to the use case default for an unusable limit (%s)',
        async (limit) => {
          await controller.handle(
            rpc('tools/call', { name: 'list_applications', arguments: { limit } }),
            USER_ID,
          );

          expect(deps.getApplicationsPageUseCase.execute).toHaveBeenCalledWith(
            expect.objectContaining({ limit: undefined }),
          );
        },
      );

      it('returns the page envelope so a client can follow nextCursor', async () => {
        vi.mocked(deps.getApplicationsPageUseCase.execute).mockResolvedValue({
          items: [{ id: 'a1' }],
          hasNextPage: true,
          nextCursor: 'a1',
        } as never);

        const { body } = await controller.handle(
          rpc('tools/call', { name: 'list_applications', arguments: {} }),
          USER_ID,
        );

        const text = (body as { result: { content: Array<{ text: string }> } }).result.content[0]
          .text;
        expect(JSON.parse(text)).toMatchObject({ hasNextPage: true, nextCursor: 'a1' });
      });

      it('advertises limit and cursor in the tool schema', () => {
        const tool = MCP_TOOLS.find((t) => t.name === 'list_applications');
        expect(Object.keys(tool!.inputSchema.properties)).toEqual(
          expect.arrayContaining(['status', 'limit', 'cursor']),
        );
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

    it('calls list_work_experiences and returns the result', async () => {
      const experiences = [{ id: 'we-1', company: 'Acme' }];
      vi.mocked(deps.workExperienceRepository.findAllByUserId).mockResolvedValue(
        experiences as never,
      );

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_work_experiences', arguments: {} }),
        USER_ID,
      );

      expect(deps.workExperienceRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
      expect(body).toMatchObject({
        result: { content: [{ type: 'text', text: JSON.stringify(experiences) }] },
      });
    });

    it('calls list_educations and returns the result', async () => {
      const educations = [{ id: 'edu-1', institution: 'UC Berkeley' }];
      vi.mocked(deps.educationRepository.findAllByUserId).mockResolvedValue(educations as never);

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_educations', arguments: {} }),
        USER_ID,
      );

      expect(deps.educationRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
      expect(body).toMatchObject({
        result: { content: [{ type: 'text', text: JSON.stringify(educations) }] },
      });
    });

    it('calls list_skills and returns the result', async () => {
      const skills = [{ id: 'skill-1', name: 'TypeScript' }];
      vi.mocked(deps.skillRepository.findAllByUserId).mockResolvedValue(skills as never);

      const { body } = await controller.handle(
        rpc('tools/call', { name: 'list_skills', arguments: {} }),
        USER_ID,
      );

      expect(deps.skillRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
      expect(body).toMatchObject({
        result: { content: [{ type: 'text', text: JSON.stringify(skills) }] },
      });
    });
  });
});
