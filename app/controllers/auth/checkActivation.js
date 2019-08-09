const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const errorConfig = require('app/config/error');
const { USER_STATUS } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({
      activation_code: req.body.activation_code,
    });
    if (!user){
      return next({
        message: 'Activation code not found or activation link has expired.' 
      });
    }
    
    if (user.status !== USER_STATUS.PRE_ACTIVE){
      return next({
        message:'Your activation link has expired.'
      });
    }
    if (Date.now() > user.activation_expired_at) {
      return next({
        message:'Your activation link has expired. Please use Forgot Password function to get a new activation link.'
      });
    } 

    user = await serializer(req, user, userSerializer, {
      includePermissions: false
    });
    return res.jsend(user);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};