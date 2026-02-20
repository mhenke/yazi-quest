import globals from 'globals';
import eslint from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import * as parser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginImport from 'eslint-plugin-import';
import pluginSecurity from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', '.worktrees/'], // Ignore the dist directory and git worktrees
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    ...eslint.configs.recommended, // Basic ESLint recommended rules
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
      import: pluginImport,
      security: pluginSecurity,
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules, // TypeScript ESLint recommended rules
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      ...pluginImport.configs.recommended.rules,
      ...pluginSecurity.configs.recommended.rules,
      // Custom rules or overrides
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
      'react/jsx-uses-react': 'off', // Not needed for React 17+ with new JSX transform
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/default': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off', // Disable due to false positives with React 19 and ESM
      'security/detect-object-injection': 'off',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
    },
  },
  prettierConfig,
];
