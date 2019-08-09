const rabbitmq = require('app/helpers/rabbitmq');
const transactionModel = require('../../models/buyer').Transaction;
const { getResumeToken, saveResumeToken } = require('../utils');

const queue = 'syncDb';
const collectionName = 'transaction';

module.exports = async function(){
  const resumeToken = await getResumeToken(collectionName);
  const options = {
    fullDocument: 'updateLookup'
  };
  if (resumeToken) {
    options.resumeAfter = { _data: resumeToken };
  }
  const changeStream = transactionModel.watch(options);
  console.log('start listen transaction');
  changeStream.on('change', async (next) => {
    await saveResumeToken(next, collectionName);
    const { operationType, documentKey, updateDescription, fullDocument } = next;
    const message = JSON.stringify({
      collection: 'transaction',
      event: operationType,
      info: {
        documentKey,
        updateDescription,
        fullDocument
      }
    });
    rabbitmq.send(queue, message);
  });
};