const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({
      recovery_code: req.body.recovery_code
    });

    if (!user){
      return next({
        message: 'Recovery code not found or password recovery link has expired.'
      });
    }
    if (Date.now() > user.recovery_expired_at){
      return next({
        message:
          'Your password recovery link has expired. Please use your old password to log in or' +
          'you can click Forgot Password to get a new link for reset password'
      });
    }

    user = await serializer(req, user, userSerializer);
    return res.jsend(user);

  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};