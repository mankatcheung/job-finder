import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient, setAccessToken } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { OAuthButtons } from '#/components/OAuthButtons';
import { getErrorMessage } from '#/lib/errors';
import { LogoMark } from '#/components/LogoMark';
import { Alert, Button, FormLabel, Input } from '@trakwyn/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type FormValues = z.infer<typeof schema>;

const totpSchema = z.object({
  code: z
    .string()
    .min(6, 'Enter your 6-digit code or a backup code')
    .max(20, 'Enter your 6-digit code or a backup code'),
});
type TotpFormValues = z.infer<typeof totpSchema>;

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      success
      totpRequired
      accessToken
    }
  }
`;

const LOGIN_WITH_TOTP_MUTATION = `
  mutation LoginWithTotp($email: String!, $password: String!, $code: String!) {
    loginWithTotp(email: $email, password: $password, code: $code)
  }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { oauthError } = useSearch({ strict: false }) as { oauthError?: string };
  const [pendingCredentials, setPendingCredentials] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await gqlClient.request<{
        login: { success: boolean; totpRequired: boolean; accessToken: string | null };
      }>(LOGIN_MUTATION, data);
      if (res.login.totpRequired) {
        setPendingCredentials(data);
        return;
      }
      setAccessToken(res.login.accessToken);
      await queryClient.resetQueries();
      await navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  if (pendingCredentials) {
    return <TotpStep credentials={pendingCredentials} onBack={() => setPendingCredentials(null)} />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Trakwyn</span>
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-600 underline">
                Register
              </Link>
            </p>
          </div>

          {oauthError && <Alert>{oauthError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                {...register('email')}
                invalid={!!errors.email}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                {...register('password')}
                invalid={!!errors.password}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <Alert>
                {errors.root.message?.includes('register') ? (
                  <>
                    No account found with this email.{' '}
                    <Link to="/register" className="underline font-medium hover:text-red-700">
                      Register
                    </Link>{' '}
                    to create one.
                  </>
                ) : (
                  (errors.root.message ?? '')
                )}
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <OAuthButtons label="Sign in" />
        </div>
      </div>
    </main>
  );
}

function TotpStep({ credentials, onBack }: { credentials: FormValues; onBack: () => void }) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
  });

  const onSubmit = async (data: TotpFormValues) => {
    try {
      const res = await gqlClient.request<{ loginWithTotp: string }>(LOGIN_WITH_TOTP_MUTATION, {
        ...credentials,
        code: data.code,
      });
      setAccessToken(res.loginWithTotp);
      await queryClient.resetQueries();
      await navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Trakwyn</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Two-factor authentication
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app, or one of your backup codes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FormLabel>Code</FormLabel>
              <Input
                type="text"
                autoFocus
                {...register('code')}
                invalid={!!errors.code}
                placeholder="123456"
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
            </div>

            {errors.root && (
              <Alert>
                {errors.root.message?.includes('register') ? (
                  <>
                    No account found with this email.{' '}
                    <Link to="/register" className="underline font-medium hover:text-red-700">
                      Register
                    </Link>{' '}
                    to create one.
                  </>
                ) : (
                  (errors.root.message ?? '')
                )}
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Verifying…' : 'Verify'}
            </Button>
          </form>

          <Button variant="link" size="sm" onClick={onBack}>
            Back to sign in
          </Button>
        </div>
      </div>
    </main>
  );
}
