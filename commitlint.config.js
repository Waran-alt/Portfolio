module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New features
        'fix',      // Bug fixes
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'perf',     // Performance improvements
        'build',    // Build system changes
        'revert'    // Revert previous commits
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',   // Frontend app changes
        'backend',    // Backend API changes
        'shared',     // Shared package changes
        'docker',     // Docker configuration
        'project',    // Project-wide changes
        'deps',       // Dependency updates
        'config',     // Configuration changes
        'docs',       // Documentation
        'ci',         // CI/CD pipeline
        'release'     // Release-related changes
      ]
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100]
  }
}; 