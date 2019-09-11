const bot = require('app/models/bot');
const buyerDb = require('app/models/buyer');

module.exports = async ({ event, info }) => {
  try {
    switch (event){
      case 'insert':
        await handleInsert(info);
        break;
      case 'update':
        await handleUpdate(info);
        break;
      case 'delete':
        await handleDelete(info);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Sync bill error: ${error}`);
  }
};

const handleInsert = async info => {
  try {
    const bill = info.fullDocument;

    if (!bill.is_recurring) return;
    const { merchant_id, buyers } = bill;

    bill.origin_id = bill._id;
    bill.txn_seq = bill.tx_seq;
    bill.updated_at = bill.updatedAt;
    bill.parent_txn_seq = bill.parent_tx_seq;
    bill.buyers = await lookupBuyers(buyers);
    bill.merchant = await lookupUser(merchant_id);

    await bot.ScheduleBill.create(bill);
    console.info('Insert bill successful');
  } catch (err) {
    console.error('Insert bill error: ', err);
  }
};

const handleUpdate = async info => {
  const {
    fullDocument,
    documentKey: { _id: origin_id }, 
    updateDescription: { updatedFields: updateSet, removedFields }
  } = info;
  const { buyers, is_recurring } = fullDocument;

  if (!is_recurring) return;

  updateSet.updated_at = updateSet.updatedAt;
  const updateUnset = {};
  const update = {};

  updateSet.buyers = await lookupBuyers(buyers);
  removedFields.forEach( field => updateUnset[field] = 1 );
  if (Object.keys(updateSet).length) update.$set = updateSet;
  if (Object.keys(updateUnset).length) update.$unset = updateUnset;

  await bot.ScheduleBill.updateOne({ origin_id }, update);
  console.log('Update bill successful');
};

const handleDelete = async info => {
  const { documentKey: { _id: origin_id } } = info;
  await bot.ScheduleBill.remove({ origin_id });
  console.log('Delete bill successful');
};

const lookupBuyers = async buyers => {
  return await Promise.all(
    buyers.map(async ({ address, amount, user_id }) => {
      const user = await lookupUser(user_id);
      return {
        address, amount, user
      };
    })  
  );
};

const lookupUser = async merchant_id => {
  const { _id: origin_id, display_name, first_name, last_name, email, status } 
    = await buyerDb.User.findOne({ _id: merchant_id }, 
      'display_name first_name last_name email status');
  const merchant = { origin_id, display_name, first_name, last_name, email, status };
  return merchant;
};
