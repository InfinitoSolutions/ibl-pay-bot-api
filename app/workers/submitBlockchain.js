const botDb = require('app/models/bot');
const buyerDb = require('app/models/buyer');
const axios = require('axios');
const mongoose = require('mongoose');

module.exports = (message, channel) => {
  if (
    typeof message === 'undefined' ||
    !message ||
    typeof message.content === 'undefined' ||
    !message.content
  ) {
    return channel.ack(message);
  }

  let content = JSON.parse(message.content.toString());
  const transactionId = content.info.transaction_id;

  if (content.type === 'SendFund') {
    // API Request options
    const options = {
      url: process.env.SERVER_BLOCKCHAIN_ENDPOINT,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: {
        jsonrpc: '2.0',
        method: 'submittransaction',
        params: [
          'handlewithdrawal',
          content.info.address,
          'NEO',
          content.info.amount
        ],
        id: 1
      }
    };

    console.info(
      `Sending ${content.info.amount} NEO of ${content.info.address}`
    );
    // Send to Blockchain API
    axios(options)
      .then(res => {
        const body = res.data;

        if (body) {
          const success = typeof body.result !== 'undefined' &&
            body.result &&
            typeof body.result.txid !== 'undefined' &&
            body.result.txid;

          if (success) {
            console.info('Send Blockchain API successful ', res.data);
          } else {
            console.info(`Send Blockchain API error ${JSON.stringify(body)}`);
            const submitBlockChainLog = {
              type: 'submitBlockChainAPI',
              transactionId: transactionId,
              info: {
                message: body
              }
            };
            botDb.ActivityLog.create(submitBlockChainLog).then(() => {
              // channel.ack(message)
            });
          }
        }
        return channel.ack(message);
      })
      .catch(error => {
        console.error('Send Blockchain API error: ', error.message);
        updateFailedTransaction(transactionId);
        const submitBlockChainLog = {
          type: 'submitBlockChainAPI',
          transactionId: transactionId,
          info: {
            message: error.message
          }
        };
        botDb.ActivityLog.create(submitBlockChainLog).then(() => {
          return channel.ack(message);
        });
      });
  } else {
    return channel.ack(message);
  }
};

const updateFailedTransaction = transactionId => {
  console.info(`Updating FAILED status of ${transactionId}`);
  buyerDb.Transaction.update(
    { _id: mongoose.Types.ObjectId(transactionId) },
    { $set: { bot_status: 'FAILED' } },
    (err) => {
      console.error('Error when update FAILED bot_status', err);
    }
  );
  botDb.Transaction.update(
    { _id: mongoose.Types.ObjectId(transactionId) },
    { $set: { bot_status: 'FAILED' } },
    (err) => {
      console.error('Error when update FAILED bot_status', err);
    }
  );
};
