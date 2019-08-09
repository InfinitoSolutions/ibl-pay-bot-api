const amqpConfig = require('app/config/amqp');
const amqplib = require('amqplib');

function rabbitMq(){
  const rabbitMq = {};
  let connection = undefined;
  rabbitMq.connect = () => {
    const url = `amqp://${amqpConfig.user}:${amqpConfig.pass}@${amqpConfig.host}`;
    return amqplib.connect(url);
  };
  rabbitMq.send = async (queueName, message) => {
    if (!connection) connection = await rabbitMq.connect();
    return connection
      .createChannel()
      .then(channel => {
        return channel
          .assertQueue(queueName, { durable: true })
          .then(() => {
            channel.sendToQueue(queueName, Buffer.from(message), {
              deliveryMode: true
            });
            console.log('[x] Sent ', message);
            return channel.close();
          });
      })
      .catch(error => {
        console.error(error);
      });
  };
  return rabbitMq;
}

module.exports = rabbitMq();
