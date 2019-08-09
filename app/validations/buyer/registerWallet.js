module.exports = {
    rules: {
        address: 'required|string',
        currency: 'required|string',
        explanation: 'required|string|max:1000'
    },
    messages: {
        required: '{{ field }} field is required.',
        string: '{{ field }} must be a string.',
        'explanation.max': '{{ field }} must be less than or equal 1000 characters.'
    }
};
  