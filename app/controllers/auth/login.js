const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const { generateToken } = require('app/helpers/utils');
const bcrypt = require('bcrypt');
const randToken = require('rand-token');
const { USER_STATUS } = require('app/config/app');

const { PRE_ACTIVE, INACTIVE, ACTIVE } = USER_STATUS;

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({
      email: req.body.email
    }).populate([
      { path: 'role', populate: { path: 'permissions' } },
      'created_by'
    ]);

    if (!user) {
      res.app.emit('LoginFailed', req, res, {
        message: 'Email does not exists'
      });
      return next({
        message: {
          title: 'Login Failed',
          body: 'Invalid username or password.'
        }
      });
    }

    if (user.status === PRE_ACTIVE) {
      res.app.emit('LoginFailed', req, res, {
        message: 'User is currently inactive'
      });
      return next({
        code: 'user_preActive',
        message: `Your account is not activated yet. Please check email and click on activation link. 
        If you have not received activation link in your mailbox or your activation link is expired, you can request to Resend Activation Link below. We will send activation link to your email address`
      });
    }

    if (user.status === INACTIVE) {
      res.app.emit('LoginFailed', req, res, {
        message: 'User is currently blocked or frozen'
      });
      return next({
        message: {
          title: 'Account is Inactive',
          body:
            'Your account status is inactive, Please contact your system admin or your manager for further details.'
        }
      });
    }

    if (user.status === ACTIVE) {
      bcrypt.compare(
        req.body.password,
        user.password,
        async (error, result) => {
          if (error) {
            res.app.emit('LoginFailed', req, res, {
              message: error.message
            });
            return next({
              message: {
                title: 'Login Failed',
                body: 'Sorry, an unexpected error occured, Please try again later.'
              }
            });
          }

          if (!result) {
            res.app.emit('LoginFailed', req, res, {
              message: 'Password does not match with this email'
            });
            return next({
              message: {
                title: 'Login Failed',
                body: 'Invalid username or password.'
              }
            });
          }
          user.refresh_token = randToken.uid(256);
          user.token = generateToken(user);
          user.save();
          res.app.emit('LoginSuccess', req, res, { user: user.id });
          user = await serializer(req, user, userSerializer, {
            withToken: true,
            withRefreshToken: true
          });
          return res.jsend(user);
        }
      );
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};