module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Modern JavaScript/TypeScript preferences
    'no-console': 'off', // CLI tool needs console output
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Code style - Modern approach (no semicolons, single quotes)
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'multi-line'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'padded-blocks': ['error', 'never'],
    
    // Turn off some rules for TypeScript files
    'no-undef': 'off', // TypeScript handles this
    'no-unused-vars': 'off', // TypeScript handles this
  },
  ignorePatterns: [
    'dist/**/*',
    'bin/**/*',
    'node_modules/**/*',
    '**/*.js',
    '__tests__/tmp/**/*',
  ],
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        // Additional TypeScript-specific rules can go here
        'no-unused-vars': 'off', // Let TypeScript handle unused vars
      }
    }
  ]
}