const apiConfig = require('app/config/api');

module.exports = {
  rules: {
    'paging.limit': 'required|under:' + (apiConfig.MAX_LIMIT + 1),
    'filter.role': 'list_exists:bot,role',
    'filter.createdBy': 'exists:bot,user',
    'sort.sortBy': 'in:NAME,ROLE,EMAIL,STATUS,CREATED_DATE,CREATED_BY',
    'sort.sortType': 'in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    under:
      'Limit must be less than or equal ' + String(apiConfig.MAX_LIMIT) + '.',
    'filter.role.exists': 'Role not found.',
    'filter.createdBy.exists': 'createdBy not found.',
    'sort.sortBy.in':
      "sortBy must be one in 'NAME,ROLE,EMAIL,STATUS,CREATED_DATE,CREATED_BY'.",
    'sort.sortType.in': "sortType must be one in 'ASC,DESC'."
  },
  component: 'options'
};
