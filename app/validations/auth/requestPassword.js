module.exports = {
  rules: {
    email: 'required|string|email'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: 'Email must be a string.',
    email: 'Email format is invalid.'
  }
};
