module.exports = {
  rules: {
    first_name: 'string',
    last_name: 'string',
    display_name: 'string',
    status: 'in:active,inactive,frozen,blocked',
    explanation: 'required|string|max:1000',
    instruction: 'string|max:1000'
  },
  messages: {
    required: '{{ field }} field is required.',
    'status.in': "Status must be one in 'active,inactive,frozen,blocked'.",
    string: '{{ field }} must be a string.',
    'explanation.max': '{{ field }} must be less than or equal 1000 characters.',
    'instruction.max': '{{ field }} must be less than or equal 1000 characters.'
  }
};
