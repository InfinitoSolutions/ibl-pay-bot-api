module.exports = {
  rules: {
    email: 'required|email',
    password: 'required',
    captcha: 'required|recaptcha'
  },
  messages: {
    required: '{{ field }} field is required.',
    email: 'Email format is invalid.',
    recaptcha: 'Your recaptcha response is invalid.'
  }
};
