import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import i18next from 'eslint-plugin-i18next';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.output/**',
      'node_modules/**',
      'src/graphql/generated/**',
      'src/routeTree.gen.ts',
      '.vercel/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  prettierConfig,
  {
    plugins: { 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // JEF-82: flags hardcoded JSX text that should go through useLocale()'s
    // t() instead. `warn`, not `error` — only the nav/auth/settings/landing
    // surfaces are translated so far (phase 1); the rest of the app still
    // has untranslated copy by design, to be swept up in later phases. This
    // is deliberately the *detection* mechanism for that follow-up work, not
    // just a regression guard — see JEF-82 for the phase plan.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'warn',
        {
          mode: 'jsx-text-only',
          message: "Wrap user-facing text in useLocale()'s t() instead of a literal string.",
        },
      ],
    },
  },
);
