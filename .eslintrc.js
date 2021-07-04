module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn"
    },
    env: {
      browser: true,
      es2021: true,
      commonjs: true
    }
  };