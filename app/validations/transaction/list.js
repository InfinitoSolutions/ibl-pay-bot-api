const apiConfig = require('app/config/api');

module.exports = {
  component: 'options',
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1),
    'filter.status': 'string',
    'filter.type': 'in:PAYMENT,TRANSFER,WITHDRAW,DEPOSIT',
    'filter.tab':
      'required|in:ALL,NEW,PENDING,BLOCKED,REJECTED,APPROVED,PROCESSING,FAILED,PROCESSED',
    'filter.role': 'required|in:B,M',
    'sort.sortBy':
      'required|in:TXN_SEQUENCE,CREATED_AT,REASON_FAILED,BUYER_ID,NAME,EMAIL,CURRENCY,CRYPTO_ADDRESS,AMOUNT,TXN_TYPE,STATUS,PHYSICAL_ADDRESS,ID,PROCESSED_AT,APPROVED_AT,REJECTED_AT,BLOCKED_AT,RECEIVED_ADDRESS,FORM_TO_CRYPTO_ADDRESS,REASON,APPROVED_BY,FUND_SENT_DATE',
    'sort.sortType': 'required|in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.',
    'filter.status.string': 'Status must be string.',
    'filter.type.in':
      "Type field must be one in 'PAYMENT,TRANSFER,WITHDRAW,DEPOSIT'.",
    'filter.role.in': "Role field must be one in 'B,M'.",
    'sort.sortBy.in':
      "sortBy field must be one in 'TXN_SEQUENCE,CREATED_AT,REASON_FAILED,BUYER_ID,NAME,EMAIL,CURRENCY,AMOUNT,TXN_TYPE,STATUS,PHYSICAL_ADDRESS,ID,APPROVED_AT'.",
    'sort.sortType.in': "sortType field must be one in 'ASC,DESC'."
  }
};
