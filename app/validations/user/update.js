module.exports = {
  rules: {
    first_name: 'required|string|max:255',
    last_name: 'required|string|max:255',
    role_id: 'required|exists:bot,role',
    status: 'required|in:active,inactive',
    reset_password: 'required|boolean'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: '{{ field }} must be a string.',
    max: '{{ field }} must be more than or equal 255 characters.',
    'role_id.integer': 'Role id must be a integer.',
    'role_id.exists': 'Role not found.',
    'status.in': "Status must be 'active' or 'inactive'.",
    boolean: 'Reset password field must be a boolean.'
  }
};
