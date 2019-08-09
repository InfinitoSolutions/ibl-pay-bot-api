const blacklist = require('express-jwt-blacklist');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    blacklist.revoke(req.jwtUser);
    res.app.emit('UserLogout', req, res, { userId: req.user.id });
    return res.json({ status: 'success', message: 'Logout success!' });
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};