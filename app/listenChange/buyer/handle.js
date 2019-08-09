const bot = require('app/models/bot');
const dotObject = require('dot-object');

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
    console.error(`Sync buyer error: ${error}`);
  }
};

const handleInsert = async info => {
  try {
    const { fullDocument: buyer } = info;
    buyer.origin_id = buyer._id;
    buyer.updated_at = buyer.updatedAt;
    await bot.Buyer.create(buyer);
    console.log('Insert buyer successful');
  } catch (err) {
    console.error('Insert buyer error: ', err);
  }
};

const handleUpdate = async info => {
  const { 
    documentKey: { _id: origin_id }, 
    updateDescription: { updatedFields, removedFields },
    fullDocument
  } = info;
  try {
    const updateUnset = {};
    const update = {};
    const updateSet = updatedFields;
    let { first_name, last_name, display_name, status } = updateSet;

    updateSet.updated_at = updatedFields.updatedAt;
    removedFields.forEach(field => updateUnset[field] = 1);

    if (Object.keys(updateSet).length) update.$set = updateSet;
    if (Object.keys(updateUnset).length) update.$unset = updateUnset;
    await bot.Buyer.updateOne({ origin_id }, update);
    
    const buyer = {
      first_name: first_name || fullDocument.first_name,
      last_name: last_name || fullDocument.last_name,
      display_name: display_name || fullDocument.display_name,
      status: status || fullDocument.status
    };
    if (first_name || last_name || display_name || status){
      await updateBuyerTransaction(origin_id, buyer);
      await updateBuyerBill(origin_id, buyer);
    }
    console.log('Update buyer successful');
  } catch (err) {
    console.error('Update v error: ', err);
  }
};

const handleDelete = async info => {
  const { documentKey: { _id: origin_id } } = info;
  await bot.Buyer.deleteOne({ origin_id });
  // remove transaction relate with buyer
  await bot.Transaction.deleteMany({ 'buyer.origin_id': { $eq: origin_id } });
  console.log('Delete buyer successful');
};

const updateBuyerTransaction = async (origin_id, buyer) => {
  const updateFromBuyer = dotObject.dot({ from: buyer });
  const updateToBuyer = dotObject.dot({ to: buyer });
  const updateBuyer = dotObject.dot({ buyer: buyer });
  await Promise.all([
    bot.Transaction.updateMany({ 'from.origin_id': origin_id }, { $set: updateFromBuyer }),
    bot.Transaction.updateMany({ 'to.origin_id': origin_id }, { $set: updateToBuyer }),
    bot.Transaction.updateMany({ 'buyer.origin_id': origin_id }, { $set: updateBuyer }),
  ]);
};

const updateBuyerBill = async (origin_id, buyer) => {
  const updateFromBuyer = dotObject.dot({ buyers: { $: buyer } });
  const updateToBuyer = dotObject.dot({ to: buyer });
  await Promise.all([
    bot.ScheduleBill.updateMany({ 'buyers.origin_id': origin_id }, { $set: updateFromBuyer }),
    bot.ScheduleBill.updateMany({ 'to.origin_id': origin_id }, { $set: updateToBuyer }),
  ]);
};