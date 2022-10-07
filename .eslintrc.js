module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'import/no-unresolved': 'off',
    'import/extensions': ['error', 'never'],
    'no-use-before-define': 'off',
    'no-underscore-dangle': 'off',
    'max-len': ['warn', 180],
    'comma-dangle': 'off',
  },
  settings: {
    'import/extensions': [
      '.js',
      '.ts',
    ],
  },
};
