// const OFF = 0;
// const WARN = 1;
// const ERROR = 2;

module.exports = {
  extends: ['eslint:recommended'],
  parser: 'babel-eslint',
  env: {
    node: true,
    es6: true,
    mocha: true
  },
  rules: {
    'object-curly-spacing': [2, 'always'],
    strict: 0,
    quotes: [2, 'single', 'avoid-escape'],
    semi: [1, 'always'],
    'keyword-spacing': [2, { before: true, after: true }],
    'space-infix-ops': 2,
    'spaced-comment': [2, 'always'],
    'arrow-spacing': 2,
    'no-console': 0
  }, };
