const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const roleSerializer = require('app/serializers/bot/role');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    let roles = await botDb.Role.find({}).populate('permissions');

    roles = await serializer(req, roles, roleSerializer);

    return res.jsend(roles);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};