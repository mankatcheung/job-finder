import { useState } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient, hydrateSession, setAccessToken } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { OAuthButtons } from '#/components/OAuthButtons';
import { LogoMark } from '#/components/LogoMark';

const schema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password)
  }
`;

export const Route = createFileRoute('/register')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (authed) throw redirect({ to: '/dashboard' });
  },
  component: RegisterPage,
});

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      const res = await gqlClient.request<{ register: string }>(REGISTER_MUTATION, {
        email,
        password,
      });
      setAccessToken(res.register);
      await queryClient.resetQueries();
      setRegisteredEmail(email);
    } catch (err: unknown) {
      const msg = extractGqlError(err) ?? 'Registration failed. Please try again.';
      setError('root', { message: msg });
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm space-y-6">
          <Link to="/" className="flex items-center justify-center gap-2">
            <LogoMark size={28} />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Job Finder</span>
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We sent a verification link to{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {registeredEmail}
                </span>
                . Click the link to verify your account.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Job Finder</span>
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <OAuthButtons label="Sign up" />
        </div>
      </div>
    </div>
  );
}

function extractGqlError(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { errors?: Array<{ message?: string }> } }).response;
    return r?.errors?.[0]?.message ?? null;
  }
  return null;
}
