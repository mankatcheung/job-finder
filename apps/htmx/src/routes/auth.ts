import type { FastifyInstance } from 'fastify';
import { gqlRaw } from '../lib/gql.js';
import { authLayout, inputCls, labelCls, btnPrimary } from '../views/layout.js';

const LOGIN_MUTATION = `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) }`;
const REGISTER_MUTATION = `mutation Register($email: String!, $password: String!) { register(email: $email, password: $password) }`;
const LOGOUT_MUTATION = `mutation { logout }`;

function loginPage(error?: string): string {
  return authLayout(
    `<div class="w-full max-w-sm">
      <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p class="text-sm text-gray-500 mb-6">Welcome back to Job Finder</p>
        ${error ? `<div class="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">${error}</div>` : ''}
        <form action="/login" method="POST" class="space-y-4">
          <div>
            <label class="${labelCls}" for="email">Email</label>
            <input id="email" name="email" type="email" required autocomplete="email" class="${inputCls}" placeholder="you@example.com" />
          </div>
          <div>
            <label class="${labelCls}" for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="current-password" class="${inputCls}" />
          </div>
          <button type="submit" class="${btnPrimary} w-full">Sign in</button>
        </form>
        <p class="mt-4 text-center text-sm text-gray-500">No account? <a href="/register" class="text-blue-600 hover:underline">Create one</a></p>
      </div>
    </div>`,
    'Sign in',
  );
}

function registerPage(error?: string): string {
  return authLayout(
    `<div class="w-full max-w-sm">
      <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p class="text-sm text-gray-500 mb-6">Start tracking your job search</p>
        ${error ? `<div class="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">${error}</div>` : ''}
        <form action="/register" method="POST" class="space-y-4">
          <div>
            <label class="${labelCls}" for="email">Email</label>
            <input id="email" name="email" type="email" required autocomplete="email" class="${inputCls}" placeholder="you@example.com" />
          </div>
          <div>
            <label class="${labelCls}" for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="new-password" class="${inputCls}" placeholder="At least 8 characters" />
          </div>
          <button type="submit" class="${btnPrimary} w-full">Create account</button>
        </form>
        <p class="mt-4 text-center text-sm text-gray-500">Already have an account? <a href="/login" class="text-blue-600 hover:underline">Sign in</a></p>
      </div>
    </div>`,
    'Register',
  );
}

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/login', async (_req, reply) => {
    return reply.type('text/html').send(loginPage());
  });

  fastify.post('/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const { email = '', password = '' } = body;
    try {
      const res = await gqlRaw(LOGIN_MUTATION, { email, password });
      const json = (await res.json()) as { errors?: Array<{ message: string }> };
      if (json.errors?.length) {
        return reply.type('text/html').send(loginPage(json.errors[0]?.message ?? 'Login failed'));
      }
      // Forward Set-Cookie headers from the API
      const setCookies = res.headers.getSetCookie?.() ?? [];
      for (const c of setCookies) {
        void reply.header('set-cookie', c);
      }
      return reply.redirect('/dashboard');
    } catch {
      return reply.type('text/html').send(loginPage('Something went wrong. Please try again.'));
    }
  });

  fastify.get('/register', async (_req, reply) => {
    return reply.type('text/html').send(registerPage());
  });

  fastify.post('/register', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const { email = '', password = '' } = body;
    try {
      const res = await gqlRaw(REGISTER_MUTATION, { email, password });
      const json = (await res.json()) as { errors?: Array<{ message: string }> };
      if (json.errors?.length) {
        return reply
          .type('text/html')
          .send(registerPage(json.errors[0]?.message ?? 'Registration failed'));
      }
      const setCookies = res.headers.getSetCookie?.() ?? [];
      for (const c of setCookies) {
        void reply.header('set-cookie', c);
      }
      return reply.redirect('/dashboard');
    } catch {
      return reply
        .type('text/html')
        .send(registerPage('Something went wrong. Please try again.'));
    }
  });

  fastify.post('/logout', async (request, reply) => {
    try {
      await gqlRaw(LOGOUT_MUTATION, {}, request.headers.cookie ?? '');
    } catch {
      // ignore
    }
    // Expire both cookies
    void reply.header(
      'set-cookie',
      'jf_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
    );
    void reply.header(
      'set-cookie',
      'jf_refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
    );
    return reply.redirect('/login');
  });
}
