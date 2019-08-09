const { rule } = require('indicative');

module.exports = {
  rules: {
    old_password: 'required|string|max:255',
    new_password: [
      rule('required'),
      rule('string'),
      rule('min', 8),
      rule('max', 21),
      rule('notStartsWith', ' '),
      rule('notEndsWith', ' '),
      rule('excludes', '   '),
      rule('regex', /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/)
    ],
    confirmed_password: 'required|string|same:new_password'
  },
  messages: {
    required: '{{ field }} field is required.',
    string: '{{ field }} field must be a string.',
    'old_password.max':
      'Old password must be less than or equal 255 characters.',
    'new_password.string':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.min':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.max':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.notStartsWith':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.notEndsWith':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.excludes':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'new_password.regex':
      'Password must be a string with length from 8 to 21 characters, does not start or end with a space, do not have three continuous spaces, must have at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character.',
    'confirmed_password.same':
      'New password and the confirmed one must be the same.'
  }
};
