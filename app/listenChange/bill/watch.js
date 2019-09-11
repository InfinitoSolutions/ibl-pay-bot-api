const rabbitmq = require('app/helpers/rabbitmq');
const billModel = require('../../models/buyer').Bill;
const { getResumeToken, saveResumeToken } = require('../utils');

const queue = 'syncDb';
const collectionName = 'bill';

module.exports = async function(){
  const resumeToken = await getResumeToken(collectionName);
  const options = {
    fullDocument: 'updateLookup'
  };
  if (resumeToken) {
    options.resumeAfter = { _data: resumeToken };
  }
  const changeStream = billModel.watch(options);
  console.log('start listen bill');
  changeStream.on('change', async next => {
    await saveResumeToken(next, collectionName);
    const { operationType, documentKey, updateDescription, fullDocument } = next;
    const message = JSON.stringify({
      collection: 'bill',
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