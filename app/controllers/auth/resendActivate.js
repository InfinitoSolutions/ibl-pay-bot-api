const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const uuid = require('uuid');
const errorConfig = require('app/config/error');
const { USER_STATUS, RECOVERY_CODE_EXPIRATION } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({ email: req.body.email });

    if (!user){
      return next({
        message: 'User not found',
        status: errorConfig.status_code.NOT_FOUND
      });
    }

    if (user.status !== USER_STATUS.PRE_ACTIVE){
      return next({
        message: 'User is already active',
      });
    }
    
    user.activation_code = uuid.v4();
    let rightNow = new Date();
    user.activation_expired_at = rightNow.setDate(
      rightNow.getDate() + RECOVERY_CODE_EXPIRATION
    );

    await user.save();

    res.app.emit('ResendActivate', req, res, {
      userId: user.id,
      firstName: user.first_name,
      email: user.email,
      activationCode: user.activation_code
    });
    user = await serializer(req, user, userSerializer, {
      includePermissions: false
    });
    return res.jsend({
      activation_code: user.activation_code
    });
    
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};