const errorConfig = require('app/config/error');
const botDb = require('app/models/bot');
const exporter = require('app/helpers/exporter');
const serializer = require('express-serializer');
const transactionSerializer = require('app/serializers/bot/transactionUpcoming');
const { generateToken, searchByDate, filterDate } = require('app/helpers/utils');
const { TRANSACTION_STATUS, EXPORT_HEADER, DIRECT_EXPORT_LIMIT } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const {
      sort: { sortBy, sortType },
      paging: { limit, offset },
      filter: { status, currency, dateFrom, dateTo, meaning },
      search    
    } = req.options;
    
    const query = {
      status: { $eq: TRANSACTION_STATUS.CONFIRMED },
      available_at: { $ne: null }
    };

    if (meaning){
      query.meaning = { $in: genarationMeaning(meaning) };
    }

    if (listStatus.includes(status)) {
      query.bot_status = status;
    }

    if (CURRENCY[currency]) {
      query.currency = CURRENCY[currency];
    }

    const matchUpdateDate = filterDate(dateFrom, dateTo);
    if (Object.keys(matchUpdateDate).length) {
      query.available_at = matchUpdateDate;
    }

    let pipeline = [
      { $unwind: { path: '$buyers', preserveNullAndEmptyArrays: false } },
      { $addFields: {
        available_at: '$recurring.next_run_at',
        end_date: '$recurring.end_date',
        amount: '$buyers.amount',
        from: '$buyers.user',
        to: '$merchant'
      } },
      { $match: query }
    ];

    if (search && search.keyword) {
      const regex = new RegExp(search.keyword, 'i');
      pipeline.push({
        $match: {
          $or: [
            { [mapField.FROM_NAME]: regex },
            { [mapField.TO_NAME]: regex },
            { [mapField.FROM_EMAIL]: regex },
            { [mapField.TO_EMAIL]: regex },
            { [mapField.AVAILABLE_DATE]: searchByDate(search.keyword) }
          ]
        }
      });
    }

    if (mapField[sortBy]) pipeline.push({ $sort: { [mapField[sortBy]]: sortType == 'DESC' ? 1 : -1 } });

    req.query.export = typeof req.query.export === 'undefined' ? false : req.query.export;
    req.query.exportType = typeof req.query.exportType === 'undefined' ? 'csv' : req.query.exportType;
    if (req.query.export === true || req.query.export === 'true') {
      return await exportTransactionUpcoming(req, res, pipeline);
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
    
    const [{ transactions, count }] = await botDb.ScheduleBill.aggregate(pipeline).allowDiskUse(true);
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
const listStatus = [
  'NEW',
  'PENDING',
  'BLOCKED',
  'REJECTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
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
  AVAILABLE_DATE: 'available_at',
  FROM_ID: 'from.origin_id',
  TO_ID: 'to.origin_id',
  AMOUNT: 'amount',
  FROM_EMAIL: 'from.email',
  TO_EMAIL: 'to.email',
  FROM_NAME: 'from.display_name',
  TO_NAME: 'to.display_name',
  CURRENCY: 'currency'
};

const exportTransactionUpcoming = async (req, res, pipeline ) => {
  const { query: { exportType }, user } = req;
  let pipelineCount = pipeline.slice();
  pipelineCount.push({
    $facet: {
      count: [{ $count: 'total' }],
    }
  });
  const headers = EXPORT_HEADER.TRANSACTION_UPCOMING;
  const alias = 'upcomingTransaction';

  const [{ count }] = await botDb.ScheduleBill.aggregate(pipelineCount).allowDiskUse(true);
  const total = count && count.length ? count[0].total : 0;

  // If the total is greater than our limit for direct export, we need to add the task to background job through message queue
  if (total >= DIRECT_EXPORT_LIMIT) {
    res.app.emit('BackgroundExportRequested', req, res, {
      database: 'bot',
      model: 'ScheduleBill',
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
  
  const items = await botDb.ScheduleBill.aggregate(pipeline).allowDiskUse(true);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const fileName = `storage/export/${currentTimestamp}-export-${alias}.${req.query.exportType}`;
  const exportSerializers = require(`app/serializers/bot/export/${alias.toLowerCase()}`);
  const exporterCallback = () => {
    console.log(`Finish exporting from row 0 to ${total}`);

    const downloadToken = generateToken(user, { download: true });

    return res.jsend({
      file: `${process.env.API_HOST}/api/reports/` +
      `download?timestamp=${currentTimestamp}&token=${downloadToken}&type=${req.query.exportType}&report=${alias}`
    });
  };

  exporter(exportType, fileName, headers, exportSerializers, items, exporterCallback);
};