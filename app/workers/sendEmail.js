const Email = require('email-templates');
const path = require('path');
const { MAIL_FROM_ADMIN, SMTP_AUTH_USER_ADMIN, SMTP_AUTH_PASS_ADMIN,
  SMTP_HOST, SMTP_PORT, SMTP_SECURE,
  SMTP_AUTH_USER_SUPPORT, SMTP_AUTH_PASS_SUPPORT } = process.env;

const template = ['updateBuyer', 'updateTransaction'];

const emailAdmin = new Email({
  message: { from: MAIL_FROM_ADMIN },
  send: true,
  transport: {
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_SECURE),
    auth: {
      user: SMTP_AUTH_USER_ADMIN,
      pass: SMTP_AUTH_PASS_ADMIN
    }
  },
  views: { root: './views/emails' },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.resolve('public')
    }
  },
  // preview: {
  //   // Chrome is 'google chrome' on macOS, 'google-chrome' on Linux and 'chrome' on Windows.
  //   app: 'google-chrome',
  //   wait: false,
  //   background: true
  // }
});

const emailSupport = new Email({
  message: { from: SMTP_AUTH_USER_SUPPORT },
  send: true,
  transport: {
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_SECURE),
    auth: {
      user: SMTP_AUTH_USER_SUPPORT,
      pass: SMTP_AUTH_PASS_SUPPORT
    }
  },
  views: { root: './views/emails' },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.resolve('public')
    }
  },
  // preview: {
  //     // Chrome is 'google chrome' on macOS, 'google-chrome' on Linux and 'chrome' on Windows.
  //     app: 'chrome',
  //     wait: false,
  //     background: true
  // }
});

module.exports = (message, channel) => {
  const data = JSON.parse(message.content.toString());
  if (template.includes(data.template)) {
    try {
      emailSupport.send({
        template: data.template,
        message: {
          to: data.to,
          attachments:
            typeof data.attachments !== 'undefined' ? data.attachments : []
        },
        locals: data.params,
      })
      .then(() => {
        console.info('[*] Sent email form support successfully to ' + data.to);
        channel.ack(message);
      });
    } catch (error) {
      console.error(error);
      channel.ack(message);
    }
  } else {
    emailAdmin.send({
      template: data.template,
      message: {
        to: data.to,
        attachments:
          typeof data.attachments !== 'undefined' ? data.attachments : []
      },
      locals: data.params,
    })
    .then(() => {
      console.info('[*] Sent email form admin successfully to ' + data.to);
      channel.ack(message);
    })
    .catch(error => {
      console.error(error);
      channel.ack(message);
    });
  }
};
