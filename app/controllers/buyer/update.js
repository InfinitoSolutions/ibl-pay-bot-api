const serializer = require('express-serializer');
const userBasicSerializer = require('../../serializers/buyer/userBasic');
const botDb = require('app/models/bot');
const buyerDb = require('app/models/buyer');
const errorConfig = require('app/config/error');
const ObjectId = require('mongoose').Types.ObjectId;
const { freezeUser, setKycUser } = require('app/helpers/neo');
const { TRANSACTION_STATUS, BUYER_STATUS, TRANSACTION_TYPE, DEFAULT_KYC_LEVEL } = require('app/config/app');

const { ACTIVE } = BUYER_STATUS;
const { WAITING, NEW, PENDING, APPROVED, BLOCKED } = TRANSACTION_STATUS;

const STATUS_TRANSACTION_TO_BLOCK = [WAITING, NEW, PENDING, APPROVED];

module.exports = async (req, res, next) => {
  try {
    const id = req.params.id;

    const buyer = await buyerDb.User.findById(ObjectId(id));

    if (typeof buyer === 'undefined' && !buyer) {
      return next({
        message: 'Buyer not found',
        name: errorConfig.type.VALIDATION_ERROR
      });
    }

    let changes = [];
    let transaction = [];
    const { status, first_name, last_name, display_name, explanation, instruction } = req.body;


    if (status) {
      transaction = await processTransaction(buyer._id, explanation, status);
      const cryptoCurrencies = buyer.crypto_currencies;
      // Freeze user neo address on Smart contract 
      if (cryptoCurrencies && cryptoCurrencies.length > 0 && ![ACTIVE].includes(status)) {
        // freeze user on smart contract
        const result = await freezeUser(buyer.neo_wallet);
        if (result.err) {
          res.app.emit('UpdateBuyer', req, res, {
            buyer_id: buyer.id,
            blockChainAPIErr: result.err.message
          });
          return next({ name: errorConfig.type.INTERNAL_SERVER_ERROR });
        }
      } else {
        // set kyc user on smart contract
        const result = await setKycUser(buyer.neo_wallet, DEFAULT_KYC_LEVEL);
        if (result.err) {
          res.app.emit('UpdateBuyer', req, res, {
            buyer_id: buyer.id,
            blockChainAPIErr: result.err.message
          });
          return next({ name: errorConfig.type.INTERNAL_SERVER_ERROR });
        }
      }

      addChange(changes, 'status', status, buyer);
    }
    if (first_name) addChange(changes, 'first_name', first_name, buyer);
    if (last_name) addChange(changes, 'last_name', last_name, buyer);
    if (display_name) addChange(changes, 'dispaly_Name', display_name, buyer);
    await buyer.save();

    if (transaction.length) {
      res.app.emit('UpdateTransaction', req, res, {
        updateBuyer: true,
        status,
        transaction,
        explanation,
        instruction,
      });
    }

    res.app.emit('UpdateBuyer', req, res, {
      buyer_id: buyer.id,
      displayName: buyer.display_name,
      email: buyer.email,
      changes,
      explanation,
      instruction
    });

    const data = await serializer(req, buyer, userBasicSerializer);
    return res.jsend(data);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};

const addChange = (changes, type, value, buyer) => {
  changes.push({
    type,
    new_value: value,
    old_value: buyer[type]
  });
  buyer[type] = value;
};

const processTransaction = async (buyerId, reason, status) => {
  let aggregates = [{
    $match: {
      'buyer.origin_id': buyerId,
      tran_type: TRANSACTION_TYPE.WITHDRAW,
      status: status === ACTIVE ? BLOCKED : { $in: STATUS_TRANSACTION_TO_BLOCK }
    }
  }];
  if (status === ACTIVE) {
    aggregates.push({
      $match: {
        blocked_by_bot: { $exists: false }
      }
    });
  }

  const transactions = await botDb.Transaction.aggregate(aggregates);

  if (!transactions || !transactions.length) return [];
  
  transactions.forEach(async (trans) => {
    const setBlockUpdate = {
      bot_status: BLOCKED,
      sub_status: trans.bot_status,
      status: BLOCKED, 
      blocked_at: new Date(),
      updatedAt: new Date(),
      reason_bot: reason
    };
    const setActiveUpdate = {
      bot_status: trans.sub_status || NEW,
      status: PENDING,
      updatedAt: new Date(),
      reason_bot: reason
    };
    const setUpdate = status === ACTIVE ? setActiveUpdate : setBlockUpdate;
    await buyerDb.Transaction.updateOne({ _id: trans._id }, { $set: setUpdate });
  });
  return transactions;
};
