const jwt = require('jsonwebtoken');
const botDb = require('app/models/bot/index');
const errorConfig = require('app/config/error');
const blacklist = require('express-jwt-blacklist');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = options => {
  return async (req, res, next) => {
    const { headers: { authorization }, query } = req;
    let token = null;
    if (authorization && authorization.split(' ')[0] === 'Bearer') {
      token = authorization.split(' ')[1];
    } else if (query && query.token) {
      token = query.token;
    }

    if (token) {
      let decoded = null;
      if (typeof req.downloadable !== 'undefined' && req.downloadable) {
        decoded = jwt.verify(token, process.env.JWT_DOWNLOAD_SECRET);
      } else {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      }

      if (typeof options === 'undefined') {
        return next({
          message: 'A route name must be defined.',
          name: errorConfig.type.UNAUTHORIZED_ERROR
        });
      }

      try {
        let user = null;
        let refreshToken = false;
        if (
          typeof options.refreshToken !== 'undefined' &&
          options.refreshToken
        ) {
          user = await botDb.User.findOne({
            _id: ObjectId(decoded.sub),
            refresh_token: req.body.refresh_token
          });

          refreshToken = true;
        } else {
          user = await botDb.User.findById(decoded.sub);
        }

        if (user) {
          // Double check the token to guarantee only one session per user is active
          if (user.token !== token && !req.downloadable) {
            blacklist.revoke(req.user);
            res.app.emit('UserSessionTerminated', req, res, {
              user: req.user.id,
              message: 'Logged in from another browser or computer.'
            });

            return next({
              message: {
                title: 'Authorization Failed',
                body: 'You have another active session.'
              },
              code: 'invalid_token',
              name: errorConfig.type.UNAUTHORIZED_ERROR
            });
          }

          // Check if user role is changed
          if (
            typeof decoded.metadata === 'undefined' ||
            decoded.metadata.role === undefined ||
            !decoded.metadata ||
            !decoded.metadata.role ||
            user.role.toString() !== decoded.metadata.role
          ) {
            blacklist.revoke(req.user);
            res.app.emit('UserSessionTerminated', req, res, {
              user: req.user.id,
              message: 'User role has been changed.'
            });

            return next({
              message: {
                title: 'Authorization Failed',
                body: 'Your role has been changed, please login again'
              },
              code: 'invalid_token',
              name: errorConfig.type.UNAUTHORIZED_ERROR
            });
          }

          if (typeof options.routeName !== 'undefined') {
            let permission = await botDb.Role.aggregate([
              {
                $lookup: {
                  from: 'permissions',
                  localField: 'permissions',
                  foreignField: '_id',
                  as: 'permissions'
                }
              },
              {
                $match: {
                  _id: user.role,
                  'permissions.route_name': options.routeName
                }
              }
            ]);

            if (!permission || !permission.length) {
              return next({
                message: {
                  title: 'Authorization Failed',
                  body: 'You are not authorized to perform this action.'
                },
                name: errorConfig.type.UNAUTHORIZED_ERROR
              });
            }
          }

          if (refreshToken) {
            blacklist.revoke(req.user);
          }

          req.jwtUser = req.user;
          req.user = user;
          return next();
        } else {
          return next({
            message: {
              title: 'Authorization Failed',
              body: 'Cannot find user associated with this token.'
            },
            name: errorConfig.type.UNAUTHORIZED_ERROR
          });
        }
      } catch (error) {
        console.error(error);
        return next({
          message: 'An internal server error occurred. Please try again later.'
        });
      }
    } else {
      return next();
    }
  };
};
