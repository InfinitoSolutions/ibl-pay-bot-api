module.exports = {
  rules: {
    activation_code: 'required|string|max:36'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: 'Activation code must be a string.',
    max: 'Activation code must be less than or equal 36 characters.'
  }
};
