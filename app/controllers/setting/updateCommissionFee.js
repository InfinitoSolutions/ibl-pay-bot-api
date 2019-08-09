const buyerDb = require('app/models/buyer');
const { changeCommision } = require('app/helpers/neo');
const errorConfig = require('app/config/error');
const { TRANSACTION_TYPE, BILL_TYPE } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const { instant, schedule, withdraw } = req.body;
    const instantUpdate = await buyerDb.Commission.findOneAndUpdate(
      { type: BILL_TYPE.INSTANT },
      { $set: { fee_percentage: instant } },
    );
    const scheduleUpdate = await buyerDb.Commission.findOneAndUpdate(
      { type: BILL_TYPE.SCHEDULE },
      { $set: { fee_percentage: schedule } },
    );
    const withdrawUpdate = await buyerDb.Commission.findOneAndUpdate(
      { type: TRANSACTION_TYPE.WITHDRAW },
      { $set: { fee_percentage: withdraw } },
    );
    
    if (instant !== instantUpdate.fee_percentage) {
      await changeCommision('COM_ChangeSinglePComm', instant);
    }
    if (schedule !== scheduleUpdate.fee_percentage) {
      await changeCommision('COM_ChangeSchedulePComm', schedule);
    }
    if (withdraw !== withdrawUpdate.fee_percentage) {
      await changeCommision('COM_ChangeWithdrawComm', withdraw);
    }

    res.app.emit('UpdateCommissionFee', req, res, {
      changes: [
        {
          type: 'instant',
          from: instantUpdate.fee_percentage,
          to: instant
        },
        {
          type: 'schedule',
          from: instantUpdate.fee_percentage,
          to: schedule
        },
        {
          type: 'withdraw',
          from: instantUpdate.fee_percentage,
          to: withdraw
        }
      ],
    });

    return res.jsend({ instantUpdate, scheduleUpdate, withdrawUpdate });
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};