const apiConfig = require('app/config/api');

module.exports = {
  component: 'options',
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1),
    'filter.status': 'in:NEW,PENDING,PROCESSED,BLOCKED,REJECTED,APPROVED',
    'filter.meaning': 'array',
    'filter.fiatCurrency': 'required|in:USD,VND',
    'sort.sortBy':
      'in:ID,NAME,EMAIL,COUNTRY,NO_TXN,AVG_COMM_RATE,CRYPTO_CURRENCY,CCY_COMM_AMOUNT,FCY_COMM_AMOUNT',
    'sort.sortType': 'in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.',
    'filter.status.in':
      'Status must be one in NEW,PENDING,PROCESSED,BLOCKED,REJECTED,APPROVED.',
    'filter.meaning.array': 'Meaning field must be a string array.',
    'filter.fiatCurrency.in': 'fiatCurrency must be one of USD,VND.',
    'filter.role.in': "Role field must be one in 'B,M'.",
    'sort.sortBy.in':
      "sortBy field must be one in 'ID,NAME,EMAIL,COUNTRY,NO_TXN,AVG_COMM_RATE,CRYPTO_CURRENCY,CCY_COMM_AMOUNT,FCY_COMM_AMOUNT'.",
    'sort.sortType.in': "sortType field must be one in 'ASC,DESC'."
  }
};
