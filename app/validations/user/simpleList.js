const apiConfig = require('app/config/api');

module.exports = {
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1)
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.'
  },
  component: 'options'
};
