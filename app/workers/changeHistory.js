const botDb = require('app/models/bot/index');

module.exports = (message, channel) => {
  try {
    if (typeof message === 'undefined' || !message ||
      typeof message.content === 'undefined' || !message.content) {
      return;
    }
    const content = JSON.parse(message.content.toString());
    botDb.ChangeHistory.create(content.info.data).then(() => {
      channel.ack(message);
    });
    console.info('[*] Created change history: ', JSON.stringify(content.info));
  } catch (error) {
    console.error('[*] Change history error: ', error);
  }
};
