module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.json', '*.md'],
      options: {
        printWidth: 120,
      },
    },
  ],
};