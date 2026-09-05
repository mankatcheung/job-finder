import expoConfig from 'eslint-config-expo/flat.js';

export default [
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**'],
  },
  ...expoConfig,
  {
    // jest.mock() calls are written above the imports they mock, by
    // convention, so the intent (mock config right above its import) reads
    // top-to-bottom — jest hoists them regardless of position. The inline
    // component stubs inside those factories are throwaway test doubles too.
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: {
      'import/first': 'off',
      'react/display-name': 'off',
      // jest.mock() factories can't reference variables from outer scope
      // (jest hoists the mock above the module's imports), so a factory
      // that needs a Node builtin has to require() it inline.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
