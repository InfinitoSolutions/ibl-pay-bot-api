const { rule } = require('indicative');

module.exports = {
  rules: {
    activation_code: 'required|string|max:255',
    password: [
      rule('required'),
      rule('string'),
      rule('min', 8),
      rule('max', 21),
      rule('notStartsWith', ' '),
      rule('notEndsWith', ' '),
      rule('excludes', '   '),
      rule('regex', /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/)
    ],
    confirmed_password: 'required|string|same:password'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: '{{ field }} must be a string.',
    'password.string':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.min':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.max':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.notStartsWith':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.notEndsWith':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.excludes':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'password.regex':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.'
  }
};
