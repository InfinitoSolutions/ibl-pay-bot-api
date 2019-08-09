const bot = require('app/models/bot');

module.exports = async ({ event, info }) => {
  try {
    switch (event){
      case 'insert':
        await handleInsert(info);
        break;
      case 'update':
        await handleUpdate(info);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Sync buyer error: ${error}`);
  }
};

const handleInsert = async info => {
  const wallet = info.fullDocument;
  const { balance = 0, debit = 0 } = wallet;
  wallet.available = balance - debit;
  wallet.origin_id = wallet._id;
  await bot.Buyer.updateOne(
    { origin_id: wallet.user_id },
    { $push: { wallets: wallet } }
  );
  console.log('Insert wallet successful');
};

const handleUpdate = async info => {
  const { 
    fullDocument: wallet
  } = info;
  const { balance = 0, debit = 0 } = wallet;
  wallet.available = balance - debit;
  wallet.origin_id = wallet._id;
  const updateSet = { 'wallets.$': wallet } ;
  await bot.Buyer.updateOne(
    { origin_id: wallet.user_id, 'wallets.origin_id': wallet._id }, 
    { $set: updateSet }
  );
  console.log('Update wallet successful');
};