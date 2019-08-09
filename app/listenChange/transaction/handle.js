const bot = require('app/models/bot');
const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const { BILL_TYPE, TRANSACTION_STATUS } = require('app/config/app');

const { PROCESSING, APPROVED, REJECTED, FAILED, BLOCKED } = TRANSACTION_STATUS;

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
    console.error(`Sync transaction error: ${error}`);
  }
};

const handleInsert = async info => {
  const transaction = info.fullDocument;
  const status = checkStatus(transaction);

  try {
    const { from_user, to_user } = transaction;
    transaction.bot_status = status;
    transaction.origin_id = transaction._id;
    transaction.updated_at = transaction.updatedAt;
    transaction.txn_seq = transaction.tx_seq;

    if (transaction.bill_type === BILL_TYPE.SCHEDULE) {
      transaction.created_at = transaction.schedule_time;
    } else {
      transaction.created_at = transaction.createdAt;
    }
    if (from_user) {
      transaction.from = await lookupUser(from_user);
    }
    if (to_user) {
      transaction.to = await lookupUser(to_user);
    }

    await bot.Transaction.create(transaction);
    await bot.Buyer.updateMany(
      { $or: [{ origin_id: from_user }, { origin_id: to_user }] },
      { $set: { last_tx_at: transaction.createdAt } }
    );
  
    console.log('Insert transaction successful');
  } catch (err) {
    console.error('Insert transaction error: ', err);
  }
};

const handleUpdate = async info => {
  const { 
    documentKey: { _id: origin_id }, 
    updateDescription: { updatedFields, removedFields },
    fullDocument
  } = info;
  try {
    const status = checkStatus(fullDocument);
    const notEnoughFund = checkTransaction(fullDocument, updatedFields);
    const now = new Date();
    const updateUnset = {};
    const update = {};
  
    updatedFields.bot_status = updatedFields.bot_status ? updatedFields.bot_status : status;
    updatedFields.updated_at = updatedFields.updatedAt || now;
    updatedFields.not_enough_fund = notEnoughFund;
    if (updatedFields.status === REJECTED) {
      updatedFields.reason_bot = updatedFields.reason || updatedFields.reason_bot;
    }
    if (updatedFields.status === FAILED) {
      updatedFields.reason_failed = updatedFields.reason;
    }
  
    removedFields.forEach(field => {
      updateUnset[field] = 1;
      if (Object.keys(updateUnset).length) update.$unset = updateUnset;
    });
    if (Object.keys(updatedFields).length) update.$set = updatedFields;
    await bot.Transaction.updateOne({ origin_id }, update);
  
    console.log('Update transaction successful');
  } catch (err) {
    console.error('Update transaction error: ', err);
  }
};

const lookupUser = async id => {
  try {
    const buyer = await buyerDb.User.findOne({ _id: ObjectId(id) });
    if (buyer) {
      const { _id, display_name, first_name, last_name, email, status } = buyer;
      return { origin_id: _id, display_name, first_name, last_name, email, status };
    }
  } catch (err) {
    console.error(err);
  }
  return null;
};

const checkStatus = (fullDocument) => {
  const { status, bot_status } = fullDocument;
  if (Object.keys(mapStatus).includes(status)) {
    if ([BLOCKED, REJECTED].includes(bot_status)) {
      return bot_status;
    }
    if (mapBotStatus[bot_status] !== status) {
      return mapStatus[status];
    }
    return bot_status;
  }
  return null;
};

const checkTransaction = (fullDocument, updatedFields) => {
  const { bot_status } = fullDocument;
  if (bot_status === PROCESSING && updatedFields.bot_status === APPROVED) {
      return true;
  }
  return false;
};

const mapBotStatus = {
  NEW: 'PENDING',
  PENDING: 'PENDING',
  APPROVED: 'PENDING',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'COMPLETED'
};

const mapStatus = {
  PENDING: 'NEW',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
  COMPLETED: 'PROCESSED'
};
