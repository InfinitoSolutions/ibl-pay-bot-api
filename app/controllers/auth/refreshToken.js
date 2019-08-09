const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const { generateToken } = require('app/helpers/utils');
const randToken = require('rand-token');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const { user } = req;
    user.refresh_token = randToken.uid(256);
    user.token = generateToken(user);
    user.save();
    const data = await serializer(req, user, userSerializer, {
      withToken: true,
      withRefreshToken: true
    });
  return res.jsend(data);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};