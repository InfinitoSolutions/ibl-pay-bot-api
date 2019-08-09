const listenChange = {
  bill: require('app/listenChange/bill'),
  buyer: require('app/listenChange/buyer'),
  transaction: require('app/listenChange/transaction'),
  wallet: require('app/listenChange/wallet')
};
const rabbitmq = require('app/helpers/rabbitmq');
const queue = 'syncDb';

try {
  rabbitmq.connect().then(conn => {
    console.log('rabbitmq connect success');
    process.once('SIGINT', () => {
      conn.close();
    });
    
    conn
      .createChannel()
      .then(channel => {
        channel
          .assertQueue(queue, { durable: true })
          .then(() => {
            channel.prefetch(1);
          })
          .then(() => {
            console.info('[*] Start consuming the following queue: ', queue);
            channel.consume(
              queue,
              message => handle(message, channel),
              { noAck: false }
            );
          });
        listenChange.bill.watch();
        listenChange.buyer.watch();
        listenChange.transaction.watch();
        listenChange.wallet.watch();
      })
      .catch(error => {
        console.error('error: ', error);
      });
  });
} catch (error) {
  console.error(error);
}

const handle = async (message, channel) => {
  try {
    if (typeof message === 'undefined' || !message || 
        typeof message.content === 'undefined' || !message.content) {
        return channel.ack(message);
    }
    const { collection, event, info } = JSON.parse(message.content.toString());
    if (collection) {
      await listenChange[collection].handle({ event, info });
    }
    return channel.ack(message);
  } catch (error) {
    console.error('Sync DB handle error: ', error);
  }
};