const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'RequestPassword',
      info: { user: data.userId }
    })
  );

  return rabbitmq.send(
    'sendEmail',
    JSON.stringify({
      to: data.email,
      template: 'requestPassword',
      params: {
        firstName: data.firstName,
        recoveryCode: data.recoveryCode,
        appBaseUrl: process.env.APP_BASE_URL,
      }
    })
  );
};
