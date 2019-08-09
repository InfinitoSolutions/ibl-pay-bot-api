
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      message: 'Setting success!'
    });
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};