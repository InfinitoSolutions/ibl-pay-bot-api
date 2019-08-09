const buyerDb = require('app/models/buyer');
const errorConfig = require('app/config/error');
const { TRANSACTION_TYPE, BILL_TYPE } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const { instant, schedule, withdraw, currency } = req.body;
    const commission = await buyerDb.Commission.findOne({ currency },);
    const instantUpdate = commission.txn_type.find(({ name }) => name === BILL_TYPE.INSTANT);
    const scheduleUpdate = commission.txn_type.find(({ name }) => name === BILL_TYPE.SCHEDULE);
    const withdrawUpdate = commission.txn_type.find(({ name }) => name === TRANSACTION_TYPE.WITHDRAW);
    instantUpdate.commission = instant;
    scheduleUpdate.commission = schedule;
    withdrawUpdate.commission = withdraw;

    const data = await commission.save();
    
    return res.jsend(data);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};