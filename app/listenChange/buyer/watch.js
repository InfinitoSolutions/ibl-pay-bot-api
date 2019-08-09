const rabbitmq = require('app/helpers/rabbitmq');
const userModel = require('../../models/buyer').User;
const { getResumeToken, saveResumeToken } = require('../utils');

const queue = 'syncDb';
const collectionName = 'buyer';

module.exports = async function(){
  const resumeToken = await getResumeToken(collectionName);
  const options = {
    fullDocument: 'updateLookup'
  };
  if (resumeToken) {
    options.resumeAfter =  { _data: resumeToken };
  }
  const changeStream = userModel.watch(options);
  console.log('start listen user');
  changeStream.on('change', async next => {
    await saveResumeToken(next, collectionName);
    const { operationType, documentKey, updateDescription, fullDocument } = next;
    const message = JSON.stringify({
      collection: 'buyer',
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