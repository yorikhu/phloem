import phloemConfig from '@phloem/eslint-config';

/**
 * Gateway-specific ESLint overrides.
 *
 * consistent-type-imports is disabled for controllers: NestJS constructor
 * injection requires the *runtime* class reference (design:paramtypes
 * metadata) — auto-converting `import { XService }` to `import type`
 * silently breaks DI (UnknownDependenciesException at boot).
 */
export default [
  ...phloemConfig,
  {
    files: ['src/modules/**/*.controller.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
