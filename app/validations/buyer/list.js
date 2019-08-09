const apiConfig = require('app/config/api');

module.exports = {
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1),
    'filter.status': 'in:active,pre-active,inactive,frozen,blocked',
    'sort.sortBy':
      'in:NAME,EMAIL,JOINED DATE,STATUS,CURRENCY,AVAILABLE BALANCE,LAST TXN DATE,ADDRESS,LAST LOGIN',
    'sort.sortType': 'in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.',
    'filter.status.in':
      "Status must be one in 'active, pre-active, inactive, frozen,blocked'.",
    'sort.sortBy.in':
      "sortBy must be one in 'NAME,EMAIL,JOINED DATE,STATUS,CURRENCY,AVAILABLE BALANCE,LAST TXN DATE,ADDRESS'.",
    'sort.sortType.in': "sortType must be one in 'ASC,DESC'."
  },
  component: 'options'
};
