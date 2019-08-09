const rabbitmq = require('app/helpers/rabbitmq');

module.exports = (req, res, data) => {
  rabbitmq.send(
    'activityLog',
    JSON.stringify({
      type: 'UserUpdated',
      info: { user: data.userId }
    })
  );

  if (data.recoveryCode) {
    return rabbitmq.send(
      'sendEmail',
      JSON.stringify({
        to: data.email,
        template: 'resetPassword',
        params: {
          recoveryCode: data.recoveryCode,
          firstName: data.firstName,
          appBaseUrl: process.env.APP_BASE_URL,
        }
      })
    );
  }
};
