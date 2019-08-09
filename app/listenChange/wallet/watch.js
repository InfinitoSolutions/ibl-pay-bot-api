const rabbitmq = require('app/helpers/rabbitmq');
const walletModel = require('../../models/buyer').Wallet;
const { getResumeToken, saveResumeToken } = require('../utils');

const queue = 'syncDb';
const collectionName = 'wallet';

module.exports = async function(){
  const resumeToken = await getResumeToken(collectionName);
  const options = {
    fullDocument: 'updateLookup'
  };
  if (resumeToken) {
    options.resumeAfter = { _data: resumeToken };
  }
  const changeStream = walletModel.watch(options);
  console.log('start listen wallet');
  changeStream.on('change',async next => {
    await saveResumeToken(next, collectionName);
    const { operationType, documentKey, updateDescription, fullDocument } = next;
    const message = JSON.stringify({
      collection: 'wallet',
      event: operationType,
      info: {
        documentKey,
        updateDescription,
        fullDocument
      }
    });
    await rabbitmq.send(queue, message);
  });
};