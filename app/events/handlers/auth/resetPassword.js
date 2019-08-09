const rabbitmq = require('app/helpers/rabbitmq');

module.exports = async (req, res, data) => {
  return rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'ResetPassword',
      info: { user: data.userId }
    })
  );
};
