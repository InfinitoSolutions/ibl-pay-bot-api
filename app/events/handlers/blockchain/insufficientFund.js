const rabbitmq = require('app/helpers/rabbitmq');
const moment = require('moment');
const { FORMAT_DATE_TIME } = require('app/config/app');

module.exports = (req, res, data) => {
  const { transaction, email, currency, amount } = data;
  const listTrans = transaction.map(item => ({
    buyer: item.buyer,
    amount: item.amount,
    currency: item.currency,
    created_at: moment(item.created_at).format(FORMAT_DATE_TIME)
  }));

  rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'InsufficientFund',
      info: {
        transaction,
      },
      changed_by: req && req.user && req.user.id,
    })
  );

  return rabbitmq.send(
    'sendEmail',
    JSON.stringify({
      to: email,
      template: 'insufficientFund',
      params: {
        amount,
        currency,
        listTrans
      }
    })
  );
};
