const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const uuid = require('uuid');
const errorConfig = require('app/config/error');
const { USER_STATUS, RECOVERY_CODE_EXPIRATION } = require('app/config/app');

const { PRE_ACTIVE, INACTIVE, ACTIVE } = USER_STATUS;

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({ email: req.body.email });

    if (user && user.status === PRE_ACTIVE) {
      res.app.emit('FailedRequestPassword', req, res, {
        message: 'User is currently pre-active status'
      });
      return next({
        code: 'user_preActive',
        message: `Your account is not activated. Please active your account and set up your password by clicking on account activation link the email we sent to you. 
        If your account activation link has expired, please select Resend Activation Link below, We will resend it to your email address`
      });
    }

    if (user && user.status === INACTIVE) {
      res.app.emit('FailedRequestPassword', req, res, {
        message: 'User is currently inactive status'
      });
      return next({
        message: {
          title: 'Account is Inactive',
          body: `Your account status is inactive, Inactive user cannot reset password.
          Please contact your system admin or manager for further details.`
        }
      });
    }

    if (user && user.status === ACTIVE) {
      if (Date.now() < user.recovery_expired_at - (RECOVERY_CODE_EXPIRATION * 24 * 60 * 60 * 1000) + (60 * 60 * 1000)) {
        return next({
          message:
            `You have just forgot your password within last 60 minutes.
            You can only request to forgot password once every 60 minutes.`
        });
      } else {
        user.recovery_code = uuid.v4();
        let rightNow = new Date();
        user.recovery_expired_at = rightNow.setDate(
          rightNow.getDate() + RECOVERY_CODE_EXPIRATION
        );

        await user.save();

        res.app.emit('RequestPassword', req, res, {
          userId: user.id,
          firstName: user.first_name,
          email: user.email,
          recoveryCode: user.recovery_code
        });
        user = await serializer(req, user, userSerializer, {
          includePermissions: false
        });
        return res.jsend({
          recovery_code: user.recovery_code
        });
      }
    } else {
      return next({
        message: {
          title: 'Account does not exist',
          body: 'The email you input not exist in our system. Please check agian'
        },
        status: errorConfig.status_code.NOT_FOUND
      });
    }
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};