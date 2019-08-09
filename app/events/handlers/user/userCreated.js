const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'UserCreated',
      info: { user: data.userId }
    })
  );

  return rabbitmq.send(
    'sendEmail',
    JSON.stringify({
      to: data.email,
      template: 'activation',
      params: {
        activationCode: data.activationCode,
        firstName: data.firstName,
        email: data.email,
        appBaseUrl: process.env.APP_BASE_URL,
      }
    })
  );
};
