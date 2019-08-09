const errorConfig = require('app/config/error');
const botDb = require('app/models/bot');
const serializer = require('express-serializer');
const transactionSerializer = require('app/serializers/bot/transactionHistory');
const exporter = require('app/helpers/exporter');
const { generateToken, searchByDate, searchById, filterDate } = require('app/helpers/utils');
const { EXPORT_HEADER, DIRECT_EXPORT_LIMIT, TRANSACTION_STATUS } = require('app/config/app');

const { NEW, PENDING, BLOCKED, APPROVED, PROCESSING, WAITING } = TRANSACTION_STATUS;
module.exports = async (req, res, next) => {
  try {
    const {
      sort: { sortBy, sortType },
      paging: { limit, offset },
      filter: { status, currency, dateFrom, dateTo, meaning },
      search
    } = req.options;
    
    const query = {
      bot_status: { $nin: [NEW, PENDING, BLOCKED, APPROVED, PROCESSING] },
      status: { $ne: WAITING }
    };

    if (meaning){
      query.meaning = { $in: genarationMeaning(meaning) };
    }

    if (listStatus.includes(status)) {
      query.bot_status = status;
    }

    if (txnBuyerStatus.includes(status)) {
      query.status = status;
    }

    if (CURRENCY[currency]) {
      query.currency = CURRENCY[currency];
    }

    const matchUpdateDate = filterDate(dateFrom, dateTo);
    if (Object.keys(matchUpdateDate).length) {
      query.created_at = matchUpdateDate;
    }

    let pipeline = [
      { $addFields: {
        meaning: {
          $cond: [{ $eq: ['$tran_type', 'PAYMENT'] }, '$bill_type', '$tran_type'] }
        }
      },
      { $match: query }
    ];

    if (search && search.keyword) {
      const regex = new RegExp(search.keyword.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { [mapField.FROM_NAME]: regex },
            { [mapField.TO_NAME]: regex },
            { [mapField.FROM_EMAIL]: regex },
            { [mapField.TO_EMAIL]: regex },
            { [mapField.TRAN_MEANING]: regex },
            { [mapField.TXN_SEQUENCE]: search.keyword },
            { [mapField.CREATED_DATE]: searchByDate(search.keyword) },
            { [mapField.FROM_ID]: searchById(search.keyword) },
            { [mapField.TO_ID]: searchById(search.keyword) },
            { [mapField.ID]: searchById(search.keyword) },
          ]
        }
      });
    }

    if (mapField[sortBy]) pipeline.push({ $sort: { [mapField[sortBy]]: sortType == 'DESC' ? 1 : -1 } });
    req.query.export = typeof req.query.export === 'undefined' ? false : req.query.export;
    req.query.exportType = typeof req.query.exportType === 'undefined' ? 'csv' : req.query.exportType;
    if (req.query.export === true || req.query.export === 'true') {
      return await exportTransactionHistory(req, res, pipeline);
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

const genarationMeaning = values => {
  return values;
};
const listStatus = ['FAILED', 'REJECTED', 'PROCESSED'];
const txnBuyerStatus = ['COMPLETED', 'CANCELLED'];
const CURRENCY = {
  BTC: 'BTC',
  ETH: 'ETH',
  NEO: 'NEO',
  USD: 'USD'
};
const mapField = {
  ID: '_id',
  TXN_SEQUENCE: 'txn_seq',
  CREATED_DATE: 'created_at',
  AMOUNT: 'amount',
  FROM_ID: 'from._id',
  TO_ID: 'to._id',
  FROM_EMAIL: 'from.email',
  TO_EMAIL: 'to.email',
  FROM_NAME: 'from.display_name',
  TO_NAME: 'to.display_name',
  STATUS: 'bot_status',
  TRAN_MEANING: 'meaning',
  CURRENCY: 'currency'
};

const exportTransactionHistory = async (req, res, pipeline ) => {
  const { query: { exportType }, user } = req;
  let pipelineCount = pipeline.slice();
  pipelineCount.push({
    $facet: {
      count: [{ $count: 'total' }],
    }
  });
  const headers = EXPORT_HEADER.TRANSACTION_HISTORY;
  const alias = 'historicalTransaction';

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
  let pipelineDocs = pipeline.slice();
  pipelineDocs.push({
    $facet: {
      docs: [{ $skip: 0 }]
    }
  });
  const [{ docs }] = await botDb.Transaction.aggregate(pipelineDocs).allowDiskUse(true);
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

  exporter(exportType, fileName, headers, epxortSerializers, docs, exporterCallback);
};