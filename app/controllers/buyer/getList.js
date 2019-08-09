const buyerExportSerializer = require('app/serializers/bot/export/buyer');
const botDb = require('app/models/bot');
const exporter = require('app/helpers/exporter');
const errorConfig = require('app/config/error');
const { mergeWalletAndCryptoAddress, generateToken, searchById, 
  filterDate, filterBalance } = require('app/helpers/utils');
const { DIRECT_EXPORT_LIMIT } = require('app/config/app');

const mapField = {
  'JOINED DATE': 'activated_at',
  'LAST TXN DATE': 'last_tx_at',
  'LAST LOGIN': 'last_login_at',
  STATUS: 'status',
  EMAIL: 'email',
  NAME: 'display_name'
};

module.exports = async (req, res, next) => {
  try {
    const {
      filter: { currency, status, joinDateFrom, joinDateTo, lastLoginFrom,
        lastLoginTo, lastTxnDateFrom, lastTxnDateTo, balanceMax, balanceMin },
      paging: { limit, offset },
      sort: { sortBy, sortType },
      search
    } = req.options;
    const query = {};
    
    if (status) query.status = status;

    if (currency) query['wallets.currency'] = currency;
    
    const matchBalance = filterBalance(balanceMin, balanceMax);
    if (Object.keys(matchBalance).length) {
      query.wallets = { $elemMatch: { available: matchBalance } };
    }

    const matchJoiDate = filterDate(joinDateFrom, joinDateTo);
    if (Object.keys(matchJoiDate).length) {
      query.activated_at = matchJoiDate;
    }

    const matchLastLogin = filterDate(lastLoginFrom, lastLoginTo);
    if (Object.keys(matchLastLogin).length) {
      query.last_login_at = matchLastLogin;
    }
    
    const matchLastTxnDate = filterDate(lastTxnDateFrom, lastTxnDateTo);
    if (Object.keys(matchLastTxnDate).length) {
      query.last_tx_at = matchLastTxnDate;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { display_name: regex },
        { email: regex },
        { 'crypto_currencies.address': regex },
        { origin_id: searchById(search) }
      ];
    }

    let pipeline = [
      { $match: query }
    ];
    if (mapField[sortBy]) pipeline.push({ $sort: { [mapField[sortBy]]: sortType == 'DESC' ? 1 : -1 } });

    req.query.export = typeof req.query.export === 'undefined' ? false : req.query.export;
    req.query.exportType = typeof req.query.exportType === 'undefined' ? 'csv' : req.query.exportType;
    if (req.query.export === true || req.query.export === 'true') {
      pipeline.push({ $unwind: { path: '$wallets', preserveNullAndEmptyArrays: true } });
      pipeline.push({
        $addFields: {
          crypto_currencies:
            {
              $filter: {
                input: '$crypto_currencies',
                as: 'crypto_currency',
                cond: { $eq: ['$$crypto_currency.currency', '$wallets.currency'] }
              }
            }
        }
      });
      pipeline.push({ $unwind: { path: '$crypto_currencies', preserveNullAndEmptyArrays: true, includeArrayIndex: 'index' } });
      
      return await exportBuyer(req, res, pipeline);
    }

    pipeline.push({
      $facet: {
        count: [{ $count: 'total' }],
        buyers: [
          { $skip: Number(offset) ? Number(offset) : 0 },
          { $limit: Number(limit) ? Number(limit) : 10 }
        ]
      }
    });

    const [{ buyers, count }] = await botDb.Buyer.aggregate(pipeline).allowDiskUse(true);
    const total = count && count.length ? count[0].total : 0;

    let data = buyers.map(doc => {
      if (doc.wallets) {
        doc.wallets = mergeWalletAndCryptoAddress(doc.wallets, doc.crypto_currencies);
      }
      return doc;
    });

    return res.json({
      status: 'success',
      data,
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

const exportBuyer = async (req, res, pipeline) => {
  const { query: { exportType, header: headers }, user } = req;
  let pipelineCount = pipeline.slice();
  pipelineCount.push({
    $facet: {
      count: [{ $count: 'total' }],
    }
  });
  const [{ count }] = await botDb.Buyer.aggregate(pipelineCount).allowDiskUse(true);
  const total = count && count.length ? count[0].total : 0;
  if (total >= DIRECT_EXPORT_LIMIT) {
    res.app.emit('BackgroundExportRequested', req, res, {
      database: 'bot',
      model: 'Buyer',
      plural: 'buyers',
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
      message: 'The request was added to queue and will be processed in background.' + 
        ' Zip files will be sent to your email address'
    });
  }
  let pipelineDocs = pipeline.slice();
  pipelineDocs.push({
    $facet: {
      docs: [{ $skip: 0 }]
    }
  });
  const [{ docs: buyers }] = await botDb.Buyer.aggregate(pipelineDocs).allowDiskUse(true);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const fileName = `storage/export/${currentTimestamp}-export-buyer.${exportType}`;
  const exporterCallback = function(){
    console.log(`Finish exporting from row 0 to ${total}`);

    const downloadToken = generateToken(user, { download: true });

    return res.jsend({
      file: `${process.env.API_HOST}/api/buyers/download` +
        `?timestamp=${currentTimestamp}&token=${downloadToken}&type=${exportType}`
    });
  };

  exporter(exportType, fileName, headers, buyerExportSerializer, buyers, exporterCallback);
};


