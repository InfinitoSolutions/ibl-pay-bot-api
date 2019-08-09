const botDb = require('app/models/bot/index');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const { params: { id: userId } } = req;
    const userPopulated = await botDb.User.findById(userId)
      .populate(['role', 'created_by']);
      
    if (!userPopulated) {
      return next({
        message: { id: 'User not found' },
        status: errorConfig.status_code.NOT_FOUND
      });
    }

    const result = await serializer(req, userPopulated, userSerializer, {
      includePermissions: false
    });

    return res.jsend(result);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};