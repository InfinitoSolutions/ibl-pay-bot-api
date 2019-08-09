const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  return rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'LoginSuccess',
      info: {
        user: data.user,
        ip_address: req.headers['x-real-ip'],
        user_agent: req.headers['user-agent']
      }
    })
  );
};
