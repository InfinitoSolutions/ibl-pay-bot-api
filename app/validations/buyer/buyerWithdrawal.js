module.exports = {
  component: 'query',
  rules: {
    sortBy: 'required|in:STATUS,CREATED_AT',
    sortType: 'required|in:ASC,DESC'
  },
  messages: {
    required: '{{ field }} field is required.',
    exists: 'User with this id is not found.',
    'sortBy.in': 'Sort By must be one in STATUS,CREATED_AT',
    'sortType.in': 'Sort Type must be one in ASC,DESC'
  }
};
