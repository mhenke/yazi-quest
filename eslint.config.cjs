module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json']
      },
      globals: { window: true, document: true }
    },
    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin'), react: require('eslint-plugin-react'), 'react-hooks': require('eslint-plugin-react-hooks') },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-console': ['warn', { allow: ['warn','error'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error'
    },
    settings: { react: { version: 'detect' } }
  },
  { ignores: ['dist/', 'build/', 'node_modules/'] }
];
