const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  return rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'UserNameChanged',
      info: data
    })
  );
};
