const buyerDb = require('app/models/buyer');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const currency = req.query[0];
    let commission = await buyerDb.Commission.findOne({ currency });

    return res.jsend(commission);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};