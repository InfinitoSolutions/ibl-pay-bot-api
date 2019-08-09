const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const errorConfig = require('app/config/error');
const { USER_STATUS } = require('app/config/app');

const { ACTIVE, PRE_ACTIVE } = USER_STATUS;

module.exports = async (req, res, next) => {
  try {
    let user = await botDb.User.findOne({
      activation_code: req.body.activation_code,
    }).populate(['role', 'created_by']);
    if (!user){
      return next({
        message: 'Activation code not found or activation link has expired.' 
      });
    }
    
    if (user.status !== PRE_ACTIVE){
      return next({
        message:'Your activation link has expired.'
      });
    }
    if (Date.now() > user.activation_expired_at) {
      return next({
        message:'Your activation link has expired. Please use Forgot Password function to get a new activation link.'
      });
    } 
    user.password = await bcrypt.hash(req.body.password, saltRounds);
    user.status = ACTIVE;
    user.activation_code = null;
    user.last_passwords = user.password;
    await user.save();
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