const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const compat = new FlatCompat();

module.exports = [
  js.configs.recommended,
  ...compat.config({
    root: true,
    extends: ['plugin:@nx/typescript', 'plugin:@nx/javascript'],
    ignorePatterns: ['**/dist'],
    plugins: ['@nx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
    overrides: [
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {},
      },
    ],
  }),
];
