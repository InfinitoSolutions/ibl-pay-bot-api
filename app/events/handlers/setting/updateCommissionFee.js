const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  return rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'UpdateCommissionFee',
      info: {
          changes: data.changes,
      },
      changed_by: req.user.id
    })
  );
};