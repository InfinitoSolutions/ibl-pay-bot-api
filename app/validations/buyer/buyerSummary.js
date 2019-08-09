module.exports = {
  component: 'params',
  rules: {
    id: 'required|exists:buyer,user'
  },
  messages: {
    required: '{{ field }} field is required.',
    exists: 'User with this id is not found.'
  }
};
