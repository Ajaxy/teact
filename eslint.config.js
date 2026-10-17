// Based on Telegram Web A's eslint.config.js (telegram-tt@f67a40879), so that the imported Teact files lint clean
// with the same rules. App-only plugins and rules are left out.
import eslint from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import stylisticJs from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import noNullPlugin from 'eslint-plugin-no-null';
import reactHooksStaticDeps from 'eslint-plugin-react-hooks-static-deps';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylistic,
  eslintReact.configs['recommended-typescript'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  stylisticJs.configs.customize({
    semi: true,
    arrowParens: 'always',
    braceStyle: '1tbs',
    quoteProps: 'as-needed',
  }),
  globalIgnores([
    '.cache/',
    '**/dist/',
    'docs/',
  ]),
  {
    name: 'teact-config',
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    settings: {
      react: {
        version: '19',
      },
      'import-x/resolver': {
        typescript: {
          // Each workspace's `paths`; the demo and the tests resolve `@teact/core` to the package source
          project: [
            'packages/*/tsconfig.json',
            'packages/*/test/tsconfig.json',
            'demo/tsconfig.json',
          ],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      'no-null/no-null': 'error',
      'no-console': 'error',
      'no-template-curly-in-string': 'error',
      'object-shorthand': 'error',
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': [
        'error',
        {
          boolean: true,
          disallowTemplateShorthand: true,
        },
      ],
      'no-prototype-builtins': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
        enums: 'always-multiline',
        tuples: 'always-multiline',
        generics: 'ignore',
      }],
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/max-len': ['error', {
        code: 120,
        ignoreComments: true,
      }],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        flatTernaryExpressions: false,
      }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports
            ['^\\u0000'],
            // Lib and global imports
            [
              '^react',
              '^@?\\w',
              'dist(/.*|$)',
              '^(\\.+/)+(lib/teact)(/.*|$)',
            ],
            // Type imports
            [
              '^(\\.+/)+.+\\u0000$',
              '^(\\.+/|\\w+/)+(types)(/.*|$)',
              '^(\\.+/|\\w+/)+(types)\\u0000',
            ],
            // Config, utils, helpers
            [
              '^(\\.+/)+config',
              '^(\\.+/)+(lib)(?!/teact)(/.*|$)',
              '^(\\.+/)+(util)(/.*|$)',
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
            ],
            // Hooks
            [
              '.+(/hooks/)(.*|$)',
            ],
            // Components
            [
              '/[A-Z](([a-z]+[A-Z]?)*)',
            ],
          ],
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'unused-imports/no-unused-imports': 'error',
      'import-x/namespace': ['error', { allowComputed: true }],
      'import-x/no-unresolved': 'error',
      'import-x/no-named-as-default-member': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks-static-deps/exhaustive-deps': [
        'error',
        {
          staticHooks: {
            useForceUpdate: true,
          },
        },
      ],
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/no-clone-element': 'off',
      '@eslint-react/component-hook-factories': 'off',
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/web-api-no-leaked-event-listener': 'off',
      '@eslint-react/web-api-no-leaked-fetch': 'off',
      '@eslint-react/web-api-no-leaked-intersection-observer': 'off',
      '@eslint-react/web-api-no-leaked-interval': 'off',
      '@eslint-react/web-api-no-leaked-resize-observer': 'off',
      '@eslint-react/web-api-no-leaked-timeout': 'off',
      '@eslint-react/no-missing-key': 'off',
      '@eslint-react/no-nested-component-definitions': 'off',
      '@eslint-react/no-unused-props': 'off',
      '@eslint-react/dom-no-unsafe-iframe-sandbox': 'off',
      '@eslint-react/no-leaked-conditional-rendering': 'error',
    },
    plugins: {
      'no-null': noNullPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unused-imports': unusedImports,
      'react-hooks-static-deps': reactHooksStaticDeps,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', 'scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    name: 'tests',
    files: ['packages/*/test/**'],
    rules: {
      // Tests keep state setters in outer variables to drive updates, under names of their own
      '@eslint-react/use-state': 'off',
    },
  },
  {
    name: 'node-scripts',
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
);
