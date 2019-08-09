require('dotenv').config();
const rabbitmq = require('app/helpers/rabbitmq');
const queues = [
  'activityLog',
  'changeHistory',
  'sendEmail',
  'export',
  'notifyApp',
  'submitBlockchain'
];
require('app/models/buyer');

console.info('worker is starting', new Date());
try {
  rabbitmq.connect().then(conn => {
    console.log('rabbitmq connect success');
    process.once('SIGINT', () => {
      conn.close();
    });

    conn.createChannel()
      .then(channel => {
        for (let queue of queues) {
          channel
            .assertQueue(queue, { durable: true })
            .then(() => {
              channel.prefetch(1);
            })
            .then(() => {
              console.info('[*] Start consuming the following queue: ', queue);
              channel.consume(
                queue,
                message => require('app/workers/' + queue)(message, channel),
                { noAck: false }
              );
            });
        }
      })
      .catch(error => {
        console.error('error: ', error);
      });
  });
} catch (error) {
  console.error(error);
}
