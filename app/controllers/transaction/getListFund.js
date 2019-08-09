const errorConfig = require('app/config/error');
const botDb = require('app/models/bot');
const ObjectId = require('mongoose').Types.ObjectId;
const serializer = require('express-serializer');
const transactionSerializer = require('app/serializers/bot/fundTransaction');
const { searchById, filterDate } = require('app/helpers/utils');

module.exports = async (req, res, next) => {
  try {
    const {
      sort: { sortBy, sortType },
      paging: { limit, offset },
      filter: { type, status, approvedBy, currency, txnDateFrom, txnDateTo },
      search    
    } = req.options;
    
    const query = {};

    const tranTypes = typeFund[type] ? [typeFund[type]] : Object.values(typeFund);
    query.tran_type = { $in: tranTypes };

    if (listStatus.includes(status)) {
      query.bot_status = status;
    } else {
      query.bot_status = { $ne: null };
    }

    if (ObjectId.isValid(approvedBy)){
      query['approved_by._id'] = ObjectId(approvedBy);
    }

    if (CURRENCY[currency]) {
      query.currency = CURRENCY[currency];
    }

    const matchTxnDate = filterDate(txnDateFrom, txnDateTo);
    if (Object.keys(matchTxnDate).length) {
      query.created_at = matchTxnDate;
    }

    let pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'approved_by',
          foreignField: '_id',
          as: 'approved_by'
        }
      },
      { $unwind: { path: '$approved_by', preserveNullAndEmptyArrays: true } },
      { $match: query }
    ];

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { [mapField.NAME]: regex },
            { [mapField.EMAIL]: regex },
            { [mapField.TXN_SEQUENCE]: search },
            { [mapField.CRYPTO_ADDRESS]: regex },
            { [mapField.ID]: searchById(search) },
            { [mapField.BUYER_ID]: searchById(search) }, 
          ]
        }
      });
    }

    if (mapField[sortBy]) {
      pipeline.push({ $sort: { [mapField[sortBy]]: sortType == 'DESC' ? 1 : -1 } });
    }

    pipeline.push({
      $facet: {
        count: [{ $count: 'total' }],
        transactions: [
          { $skip: Number(offset) ? Number(offset) : 0 },
          { $limit: Number(limit) ? Number(limit) : 10 }
        ]
      }
    });
    
    const [{ transactions, count }] = await botDb.Transaction.aggregate(pipeline).allowDiskUse(true);
    const total = count && count.length ? count[0].total : 0;
    const docs = await serializer(req, transactions, transactionSerializer);
    return res.json({
      status: 'success',
      data: docs,
      paging: {
        limit,
        offset,
        total
      }
    });
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};

const typeFund = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW'
};
const listStatus = [
  'NEW',
  'PENDING',
  'BLOCKED',
  'REJECTED',
  'APPROVED',
  'PROCESSING',
  'FAILED',
  'PROCESSED'
];
const CURRENCY = {
  BTC: 'BTC',
  ETH: 'ETH',
  NEO: 'NEO',
  USD: 'USD'
};
const mapField = {
  CREATED_AT: 'created_at',
  AMOUNT: 'amount',
  ID: 'origin_id',
  BUYER_ID: 'buyer._id',
  TXN_SEQUENCE: 'txn_seq',
  NAME: 'buyer.display_name',
  EMAIL: 'buyer.email',
  CRYPTO_ADDRESS: 'crypto_address',
  FORM_TO_CRYPTO_ADDRESS: 'external_crypto_address',
  RECEIVED_ADDRESS: 'external_crypto_address',
  CURRENCY: 'currency',
  TXN_TYPE: 'tran_type',
  STATUS: 'bot_status',
  FAILED_AT: 'failed_at',
  BLOCKED_AT: 'blocked_at',
  REJECTED_AT: 'rejected_at',
  APPROVED_AT: 'approved_at',
  PROCESSED_AT: 'processed_at',
  FUND_SENT_DATE: 'sent_date',
  APPROVED_BY: 'approved_by.full_name',
  REASON_FAILED: 'reason_failed',
  REASON: 'reason_bot'
};
