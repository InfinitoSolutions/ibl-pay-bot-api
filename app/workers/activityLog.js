const botDb = require('app/models/bot/index');

module.exports = (message, channel) => {
  try {
    if (typeof message === 'undefined' || !message ||
      typeof message.content === 'undefined' || !message.content) {
      return;
    }
    const content = JSON.parse(message.content.toString());
    botDb.ActivityLog.create(content).then(() => {
      channel.ack(message);
    });
    console.info(`[*] Create activity log type ${content.type}: `, content);
  } catch (error) {
    console.error('[*] Create activity log error: ', error);
  }
};
