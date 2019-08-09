const errorConfig = require('app/config/error');
const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const revenueSerializer = require('app/serializers/bot/report/revenue');
const exporter = require('app/helpers/exporter');
const ObjectId = require('mongoose').Types.ObjectId;
const { generateToken, filterBalance, filterDate } = require('app/helpers/utils');
const { 
  EXPORT_HEADER, CURRENCY, DIRECT_EXPORT_LIMIT,
  TRANSACTION_STATUS, TRANSACTION_TYPE, BILL_TYPE } = require('app/config/app');

const { DEPOSIT, PAYMENT, TRANSFER, WITHDRAW } = TRANSACTION_TYPE;
const { SCHEDULE, INSTANT } = BILL_TYPE;

const LIST_CURRENCY = [CURRENCY.BTC, CURRENCY.ETH, CURRENCY.NEO];
const mapField = {
  ID: 'buyer.origin_id',
  NAME: 'buyer.display_name',
  EMAIL: 'buyer.email',
  NO_TXN: 'no_txn',
  AVG_COMM_RATE: 'meaning',
  CRYPTO_CURRENCY: '_id.currency',
  CCY_COMM_AMOUNT: 'ccy_comm_amount',
  FCY_COMM_AMOUNT: 'fcy_comm_amount'
};

module.exports = async (req, res, next) => {
  try {
    const {
      sort: { sortBy, sortType },
      paging: { limit, offset },
      filter: { fiatCurrency, meaning, cryptoCurrency, dateFrom, dateTo, fiatMin, fiatMax },
      search 
    } = req.options;

    const transactionsQuery = { 
      status: TRANSACTION_STATUS.COMPLETED,
      tran_type: { $ne: DEPOSIT }
    };
    const query = {};

    const matchUpdateDate = filterDate(dateFrom, dateTo);
    if (Object.keys(matchUpdateDate).length) {
      transactionsQuery.updated_at = matchUpdateDate;
    }
    
    const matchFiat = filterBalance(fiatMin, fiatMax);
    if (Object.keys(matchFiat).length) {
      query.fcy_comm_amount = matchFiat;
    }

    if (meaning){
      transactionsQuery.meaning = { $in: genarationMeaning(meaning) };
    }
    if (LIST_CURRENCY.includes(cryptoCurrency)){
      transactionsQuery.currency = cryptoCurrency;
    }

    let pipeline = initPipeline(transactionsQuery, fiatCurrency);
    
    pipeline.push({
      $match: query
    });

    if (search){
      const { id, name, email } = search;
      if (name) {
        // const regex = new RegExp(name, 'i');
        pipeline.push({
          $match: {
            $or: [
              { [mapField.NAME]: name },
            ]
          }
        });
      }
      if (email) {
        // const regex = new RegExp(email, 'i');
        pipeline.push({
          $match: {
            $or: [
              { [mapField.EMAIL]: email },
            ]
          }
        });
      }
      if (id) {
        pipeline.push({
          $match: {
            $or: [
              { [mapField.ID]: ObjectId(id) },
            ]
          }
        });
      }
    }

    if (mapField[sortBy]) pipeline.push({ $sort: { [mapField[sortBy]]: sortType == 'DESC' ? 1 : -1 } });
    req.query.export = typeof req.query.export === 'undefined' ? false : req.query.export;
    req.query.exportType = typeof req.query.exportType === 'undefined' ? 'csv' : req.query.exportType;
    if (req.query.export === true || req.query.export === 'true') {
      return await exportRevenue(req, res, pipeline);
    }
    pipeline.push({
      $facet: {
        count: [{ $count: 'total' }],
        docs: [
          { $skip: Number(offset) ? Number(offset) : 0 },
          { $limit: Number(limit) ? Number(limit) : 10 }
        ] 
      }
    });
    
    const [{ docs: revenues, count }] = await botDb.Transaction.aggregate(pipeline).allowDiskUse(true);
    const total = count && count.length ? count[0].total : 0;
    const docs = await serializer(req, revenues, revenueSerializer);
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

const initPipeline = (transactionsQuery, fiatCurrency) => [
  {
    $match: transactionsQuery
  },
  {
    $addFields: {
      meaning: {
        $cond: {
          if: { $eq: ['$tran_type', PAYMENT] },
          then: '$bill_type',
          else: '$tran_type'
        }
      },
      transaction_cost: { $cond: [{ $in : ['$tran_type', [TRANSFER, PAYMENT]] }, '$gas_consumed', 0 ] },
      withdrawal_cost: { $cond: [{ $eq: ['$tran_type', WITHDRAW] }, '$withdraw_fee', 0] },
      withdraw_amount: { $cond: [{ $and: [{ $eq: ['$tran_type', WITHDRAW] }, { $gt: ['$commission_fee', 0]  }] }, '$amount', 0] },
      schudule_amount: { $cond: [{ $and: [{ $eq: ['$bill_type', SCHEDULE] }, { $gt: ['$commission_fee', 0]  }] }, '$amount', 0] },
      instant_amount: { $cond: [{ $and: [{ $eq: ['$bill_type', INSTANT] }, { $gt: ['$commission_fee', 0]  }] }, '$amount', 0] },
    }
  },
  {
    $group: {
      _id: {
        $cond: {
          if: { $eq: ['$tran_type', PAYMENT] },
          then: {
            from_user: '$to.origin_id',
            currency: '$currency'
          },
          else: {
            from_user: '$from.origin_id',
            currency: '$currency'
          }
      },
    },
      buyer: { $first: { $cond: [{ $eq: ['$tran_type', PAYMENT] }, '$to', '$from'] } },
      withdraw_amount: { $sum: '$withdraw_amount' },
      schudule_amount: { $sum: '$schudule_amount' },
      instant_amount: { $sum: '$instant_amount' },
      ccy_comm_amount: { $sum: { $ifNull: ['$commission_fee', 0] } },
      transaction_cost: { $sum: { $ifNull: ['$transaction_cost', 0] } },
      withdrawal_cost: { $sum: { $ifNull: ['$withdrawal_cost', 0] } },
      no_txn: { $sum: 1 },
    }
  },
  {
    $addFields: {
      total_amount: { $add: ['$schudule_amount', '$withdraw_amount', '$instant_amount'] },
    }
  },
  {
    $lookup: {
      from: 'currencyrates',
      let: { pair: { $concat: [ fiatCurrency, '-', '$_id.currency'] } },
      pipeline: [ { $match: { $expr:
        { $and:
           [
             { $eq: [ '$pair',  '$$pair' ] },
           ]
        }
     } } ],
      as: 'crypto_rate'
    }
  },{
    $unwind: { path: '$crypto_rate', preserveNullAndEmptyArrays: true } 
  },{
    $addFields: {
      fcy_comm_amount: { $multiply: ['$ccy_comm_amount', '$crypto_rate.rate'] },
      avg_comm_rate: {
        $cond: {
          if: { $eq: ['$total_amount', 0] },
          then: 0,
          else: { $multiply: [{ $divide: ['$ccy_comm_amount', '$total_amount'] }, 100] },
        }
      }
    }
  }
];
const genarationMeaning = values => {
  return values;
};

const exportRevenue = async (req, res, pipeline) => {
  const { query: { exportType }, user } = req;
  let pipelineCount = pipeline.slice();
  pipelineCount.push({
    $facet: {
      count: [{ $count: 'total' }],
    }
  });
  const headers = EXPORT_HEADER.REVENUE;
  const alias = 'revenue';

  const [{ count }] = await botDb.Transaction.aggregate(pipelineCount).allowDiskUse(true);
  const total = count && count.length ? count[0].total : 0;

  // If the total is greater than our limit for direct export, we need to add the task to background job through message queue
  if (total >= DIRECT_EXPORT_LIMIT) {
    res.app.emit('BackgroundExportRequested', req, res, {
      database: 'bot',
      model: 'Transaction',
      plural: 'reports',
      alias: alias,
      type: exportType,
      total: total,
      headers,
      pipeline: pipeline,
      user: {
        email: user.email,
        first_name: user.first_name,
        id: user.id.toString(),
        role: user.role
      }
    });

    return res.json({
      status: 'success',
      message: 'The request was added to queue and will be processed in background. Zip files will be sent to your email address'
    });
  }  
  
  const items = await botDb.Transaction.aggregate(pipeline).allowDiskUse(true);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const fileName = `storage/export/${currentTimestamp}-export-${alias}.${req.query.exportType}`;
  const epxortSerializers = require(`app/serializers/bot/export/${alias.toLowerCase()}`);
  const exporterCallback = () => {
    console.log(`Finish exporting from row 0 to ${total}`);

    const downloadToken = generateToken(user, { download: true });

    return res.jsend({
      file: `${process.env.API_HOST}/api/reports/` +
      `download?timestamp=${currentTimestamp}&token=${downloadToken}&type=${req.query.exportType}&report=${alias}`
    });
  };

  exporter(exportType, fileName, headers, epxortSerializers, items, exporterCallback);
};