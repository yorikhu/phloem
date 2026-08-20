export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'perf', 'build', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'gateway',
        'mcp',
        'web',
        'web-next',
        'shared',
        'deploy',
        'docs',
        'api',
        'ci',
        'config',
        'deps',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
