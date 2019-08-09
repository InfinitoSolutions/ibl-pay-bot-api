const rabbitmq = require('app/helpers/rabbitmq');
const moment = require('moment');
const { FORMAT_DATE_TIME } = require('app/config/app');

module.exports = (req, res, data) => {
  const { txnFailedList, email } = data;
  const listTrans = txnFailedList.map(item => ({
    buyer: item.buyer,
    amount: item.amount,
    currency: item.currency,
    reason_failed: item.reason_failed,
    created_at: moment(item.created_at).format(FORMAT_DATE_TIME)
  }));

  rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'UnsuccessfullyBlockchain',
      info: {
        txnFailedList,
      },
      changed_by: req.user.id,
    })
  );

  return rabbitmq.send(
    'sendEmail',
    JSON.stringify({
      to: email,
      template: 'unsuccessfulBlockchain',
      params: {
        listTrans,
      }
    })
  );
};
