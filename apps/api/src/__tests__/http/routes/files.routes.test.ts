import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { PassThrough } from 'stream';
import type { IHttpRequest, IHttpResponse } from '#src/http/ports/index.js';
import type { Cradle } from '#src/http/container.js';

const authenticateRequestMock = vi.fn();
vi.mock('#src/http/auth/authenticateRequest.js', () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequestMock(...args),
}));

// Fully mock fs so the dev _upload route never touches the real disk and
// streams can be flushed deterministically. The PassThrough factory emits
// 'finish' on next tick so any handler awaiting `out.on('finish')` resolves.
const fakeWriteStream = (): PassThrough => {
  const stream = new PassThrough();
  process.nextTick(() => stream.end());
  return stream;
};
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
  createWriteStream: vi.fn(() => fakeWriteStream()),
  createReadStream: vi.fn(() => new PassThrough()),
  statSync: vi.fn(() => ({ size: 1 })),
}));

import { filesRoutes } from '#src/http/routes/files.routes.js';
import { ENV, STORAGE_PROVIDER } from '#src/constants.js';

interface FakeReply {
  statusCode: number | null;
  headers: Record<string, string>;
  body: unknown;
  status: (code: number) => FakeReply;
  send: (body: unknown) => void;
  redirect: ReturnType<typeof vi.fn>;
  setCookie: ReturnType<typeof vi.fn>;
  clearCookie: ReturnType<typeof vi.fn>;
  setHeader: (name: string, value: string | number) => void;
}

function fakeReply(): FakeReply {
  const reply: FakeReply = {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
    },
    redirect: vi.fn(),
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
    setHeader(name, value) {
      this.headers[name] = String(value);
    },
  };
  return reply;
}

function fakeIReq(key: string): IHttpRequest {
  return {
    method: 'GET',
    path: `/files/${key}`,
    headers: { host: 'api.example' },
    cookies: {},
    params: { key },
    query: {},
    body: null,
    ip: '127.0.0.1',
    protocol: 'https',
  };
}

/**
 * Build a FastifyRequest whose `raw` is a real PassThrough so `.pipe(out)`
 * actually transfers bytes. End it on next tick so the test never hangs.
 */
function fakeRawRequest(): FastifyRequest {
  const raw = new PassThrough();
  process.nextTick(() => raw.end(Buffer.from('hello')));
  return {
    cookies: {},
    headers: { authorization: undefined } as never,
    raw,
  } as unknown as FastifyRequest;
}

const makeCradle = (overrides?: {
  storageProvider?: Partial<Cradle['storageProvider']>;
}): Cradle => {
  const storageProvider = {
    delete: vi.fn(),
    getPublicUrl: vi.fn(),
    getFileStream: vi.fn(),
    getPresignedUploadUrl: vi.fn(),
    ...(overrides?.storageProvider ?? {}),
  };
  return {
    storageProvider: storageProvider as unknown as Cradle['storageProvider'],
    tokenService: {
      verifyAccess: vi.fn(),
      sign: vi.fn(),
      verifyRefresh: vi.fn(),
    } as unknown as Cradle['tokenService'],
    validateApiTokenUseCase: {
      execute: vi.fn(),
    } as unknown as Cradle['validateApiTokenUseCase'],
  } as unknown as Cradle;
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env[ENV.STORAGE_PROVIDER];
});

describe('filesRoutes — GET /files/:key', () => {
  it('streams the file when the JWT subject matches the embedded userId', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const stream = new PassThrough();
    queueMicrotask(() => stream.end(Buffer.from('hello')));
    const cradle = makeCradle({
      storageProvider: {
        getFileStream: vi.fn().mockResolvedValue({
          body: stream,
          contentType: 'application/pdf',
          sizeBytes: 5,
        }),
      },
    });

    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.headers['Content-Type']).toBe('application/pdf');
    expect(reply.headers['Content-Length']).toBe('5');
  });

  it('returns 401 when no credentials are present', async () => {
    authenticateRequestMock.mockResolvedValue(null);
    const cradle = makeCradle({ storageProvider: { getFileStream: vi.fn() } });
    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 403 when the JWT subject does not match the storage key owner', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle({ storageProvider: { getFileStream: vi.fn() } });
    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u2/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'forbidden' });
  });

  it('returns 400 when the key contains `..` (path-traversal guard)', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle({ storageProvider: { getFileStream: vi.fn() } });
    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/../etc/passwd'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'invalid_key' });
  });

  it('returns 400 when the key does not parse as `users/:userId/...`', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle({ storageProvider: { getFileStream: vi.fn() } });
    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('globals/foo'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'invalid_key' });
  });

  it('returns 404 when the storage call throws (treats as missing)', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle({
      storageProvider: { getFileStream: vi.fn().mockRejectedValue(new Error('boom')) },
    });
    const route = filesRoutes(() => cradle).find((r) => r.method === 'GET')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/files/missing.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'not_found' });
  });
});

describe('filesRoutes — POST /files/_upload/:key (dev only)', () => {
  it('returns 404 when STORAGE_PROVIDER is vercel-blob', async () => {
    process.env[ENV.STORAGE_PROVIDER] = STORAGE_PROVIDER.VERCEL_BLOB;
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle();
    const route = filesRoutes(() => cradle).find((r) => r.method === 'POST')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'not_found' });
  });

  it('requires the same owner-auth as reads', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle();
    const route = filesRoutes(() => cradle).find((r) => r.method === 'POST')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u2/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ error: 'forbidden' });
  });

  it('accepts a properly owned upload and emits { ok: true }', async () => {
    authenticateRequestMock.mockResolvedValue({ sub: 'u1', email: 'u1@example.com' });
    const cradle = makeCradle();
    const route = filesRoutes(() => cradle).find((r) => r.method === 'POST')!;
    const reply = fakeReply();
    await route.handler(
      fakeIReq('users/u1/files/x.pdf'),
      reply as unknown as IHttpResponse,
      fakeRawRequest(),
    );
    expect(reply.body).toEqual({ ok: true });
  });
});
