module.exports = {
  rules: {
    recovery_code: 'required|string|max:36'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: 'Recovery code must be a string.',
    max: 'Recovery code must be less than or equal 36 characters.'
  }
};
