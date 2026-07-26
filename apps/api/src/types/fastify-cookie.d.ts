// @fastify/cookie augments FastifyRequest/FastifyReply (request.cookies,
// reply.setCookie/clearCookie) via a `declare module 'fastify'` block in its
// own types. That augmentation only takes effect for files tsc actually
// scans, so it used to depend on app.ts being the one file that imports
// '@fastify/cookie' for its runtime registration. The Vercel deploy
// pipeline's bundling step deletes app.ts after inlining it into the
// bundled entrypoint (see deploy-api.yml) — with no file importing
// '@fastify/cookie' anymore, every other file using request.cookies /
// reply.setCookie broke. This file's only job is to keep that augmentation
// available independent of which file registers the plugin at runtime.
import '@fastify/cookie';
