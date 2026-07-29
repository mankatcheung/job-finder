import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import { dirname, join, normalize, sep } from 'path';
import { Readable } from 'stream';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { authenticateRequest } from '#src/http/auth/authenticateRequest.js';
import { ENV, STORAGE_PROVIDER } from '#src/constants.js';

/**
 * Storage keys produced by the request-upload use cases are all rooted at
 * `users/:userId/...`, so the second path segment is the owning user —
 * we use it on every read/write to confirm the caller matches.
 */
function userIdFromKey(key: string): string | null {
  const parts = key.split('/');
  if (parts.length < 2 || parts[0] !== 'users') return null;
  return parts[1] || null;
}

/**
 * Reject keys that would escape the upload directory or contain
 * control/null bytes — even though owner-match would normally protect
 * against reading another user's files, normalizing paths here means a
 * surprising slash or `..` in the URL can't trick `fs` into reading
 * outside `.uploads/` either.
 */
function isUnsafeKey(key: string): boolean {
  if (!key) return true;
  if (key.includes('..')) return true;
  if (key.includes('\0') || /[\x00-\x1f]/.test(key)) return true;
  if (key.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(key)) return true;
  return false;
}

export function filesRoutes(getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      // Read: anything under /files/* that's not the dev _upload sink.
      method: 'GET',
      path: '/files/:key(*)',
      handler: async (req, res, rawRequest) => {
        // `registerRoutes` always supplies `rawRequest` at runtime; we keep
        // it optional in the route signature so unit tests can stub the
        // port-shaped IHttpRequest without re-creating Fastify internals.
        // Throw before any work is done so a misconfigured deploy doesn't
        // surface as a confusing 500 after half-completed authn.
        if (!rawRequest) throw new Error('filesRoutes GET: rawRequest missing');
        const rawKey = req.params.key;
        if (!rawKey || rawKey.startsWith('_upload')) {
          res.status(404).send({ error: 'not_found' });
          return;
        }
        if (isUnsafeKey(rawKey)) {
          res.status(400).send({ error: 'invalid_key' });
          return;
        }
        const ownerId = userIdFromKey(rawKey);
        if (!ownerId) {
          res.status(400).send({ error: 'invalid_key' });
          return;
        }

        const user = await authenticateRequest(rawRequest, getCradle());
        if (!user) {
          res.status(401).send({ error: 'unauthorized' });
          return;
        }
        if (user.sub !== ownerId) {
          res.status(403).send({ error: 'forbidden' });
          return;
        }

        try {
          const { storageProvider } = getCradle();
          const { body, contentType, sizeBytes } = await storageProvider.getFileStream(rawKey);
          if (contentType) res.setHeader('Content-Type', contentType);
          if (sizeBytes !== undefined) res.setHeader('Content-Length', sizeBytes);
          res.send(body as unknown as Readable);
        } catch {
          // Treat any storage-side error as a missing file rather than a server
          // crash — the client has a DocumentDTO id and can retry / refresh.
          res.status(404).send({ error: 'not_found' });
        }
      },
    },
    {
      // Dev-only upload sink — Vercel uploads go browser-direct and never
      // hit this route. Identical auth/authz to reads.
      method: 'POST',
      path: '/files/_upload/:key(*)',
      handler: async (req, res, rawRequest) => {
        // Validate before any filesystem side effects (mkdir would leave
        // orphan directories on misconfigured deploys). Same guard rationale
        // as the GET route.
        if (!rawRequest) throw new Error('filesRoutes POST: rawRequest missing');
        if (process.env[ENV.STORAGE_PROVIDER] === STORAGE_PROVIDER.VERCEL_BLOB) {
          res.status(404).send({ error: 'not_found' });
          return;
        }

        const rawKey = req.params.key;
        if (!rawKey || isUnsafeKey(rawKey)) {
          res.status(400).send({ error: 'invalid_key' });
          return;
        }
        const ownerId = userIdFromKey(rawKey);
        if (!ownerId) {
          res.status(400).send({ error: 'invalid_key' });
          return;
        }
        const user = await authenticateRequest(rawRequest, getCradle());
        if (!user) {
          res.status(401).send({ error: 'unauthorized' });
          return;
        }
        if (user.sub !== ownerId) {
          res.status(403).send({ error: 'forbidden' });
          return;
        }

        try {
          const uploadDir = join(process.cwd(), 'uploads');
          const filePath = normalize(join(uploadDir, rawKey));
          // Defense in depth: confirm normalized path still lives inside the upload directory.
          if (!filePath.startsWith(uploadDir + sep) && filePath !== uploadDir) {
            res.status(400).send({ error: 'invalid_key' });
            return;
          }
          await fs.mkdir(dirname(filePath), { recursive: true });
          const out = createWriteStream(filePath);
          rawRequest.raw.pipe(out);
          await new Promise<void>((resolve, reject) => {
            out.on('finish', () => resolve());
            out.on('error', reject);
            rawRequest.raw.on('error', reject);
          });
          res.send({ ok: true });
        } catch (err) {
          res.status(500).send({ error: 'upload_failed' });
        }
      },
    },
  ];
}
