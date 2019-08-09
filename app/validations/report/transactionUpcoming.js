const apiConfig = require('app/config/api');

module.exports = {
  component: 'options',
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1),
    'filter.status':
      'in:PENDING,PROCESSING,PROCESSED,BLOCKED,REJECTED,COMPLETED,CANCELLED,FAILED',
    'filter.meaning': 'array',
    'sort.sortBy':
      'in:AVAILABLE_DATE,FROM_ID,TO_ID,FROM_NAME,TO_NAME,FROM_EMAIL,TO_EMAIL,STATUS,CURRENCY,AMOUNT',
    'sort.sortType': 'in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.',
    'filter.status.in':
      'Status must be one in PENDING,PROCESSING,PROCESSED,BLOCKED,REJECTED,COMPLETED,CANCELLED,FAILED.',
    'filter.meaning.array': 'Meaning field must be a string array.',
    'sort.sortBy.in':
      "sortBy field must be one in 'AVAILABLE_DATE,FROM_ID,TO_ID,FROM_NAME,TO_NAME,FROM_EMAIL,TO_EMAIL,STATUS,CURRENCY,AMOUNT'.",
    'sort.sortType.in': "sortType field must be one in 'ASC,DESC'."
  }
};
