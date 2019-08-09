module.exports = {
  rules: {
    email: 'required|email|max:64|unique:bot,user,email',
    first_name: 'required|string|max:255',
    last_name: 'required|string|max:255',
    role_id: 'required|exists:bot,role'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: '{{ field }} must be a string.',
    'email.unique':
      'User with email %value already exists in system. Please check data input.',
    max: '{{ field }} must be less than or equal 255 characters.',
    'role_id.exists': 'Role not found.'
  }
};
