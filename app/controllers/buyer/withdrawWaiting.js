const buyerDb = require('app/models/buyer');
const botDb = require('app/models/bot');
const errorConfig = require('app/config/error');
const ObjectId = require('mongoose').Types.ObjectId;
const { TRANSACTION_STATUS, TRANSACTION_TYPE } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const { query: { sortBy, sortType, limit, offset, txnId }, params: { id: buyerId } } = req;

    let pipeline = [];
    const buyer = await buyerDb.User.findById(ObjectId(buyerId));
    if (!buyer) {
      return next({
        message: {
          title: 'Account is not found',
        }
      });
    }
    // Filter by transaction type
    pipeline.push({
      $match: {
        'from.origin_id': buyer._id,
        'tran_type': TRANSACTION_TYPE.WITHDRAW,
        $or: [
          { bot_status: { $exists: false } },
          { bot_status: { $in: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.NEW] } },
        ]
      }
    });

    switch (sortBy) {
      case 'STATUS':
        pipeline.push({ $sort: { bot_status: sortType == 'DESC' ? 1 : -1 } });
        break;
      case 'CREATED_AT':
        pipeline.push({ $sort: { created_at: sortType == 'DESC' ? 1 : -1 } });
        break;
      default:
        break;
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

    if (txnId && offset === 'undefined') {
      const query = {
        'from.origin_id': buyer._id,
        'tran_type': TRANSACTION_TYPE.WITHDRAW,
        $or: [
          { bot_status: { $exists: false } },
          { bot_status: { $eq: null } },
          { bot_status: { $in: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.NEW] } }
        ]
      };
      const sort = {
        created_at: sortType == 'DESC' ? 1 : -1
      };
      const trans = await botDb.Transaction.find(query, null, { sort });
      const indexSelected = trans.findIndex(item => item._doc._id.toString() === txnId);
      if (indexSelected !== -1) {
        const page = Math.floor(indexSelected / limit);
        const from = Number(page) * Number(limit);
        const to = from + Number(limit);

        const data = trans.slice(from, to);
        return res.json({
          status: 'success',
          data,
          paging: {
            limit,
            offset: from,
            page,
            total: trans.length
          }
        });
      }
    }
    
    const [{ transactions, count }] = await botDb.Transaction.aggregate(pipeline).allowDiskUse(true);
    const total = count && count.length ? count[0].total : 0;

    return res.json({
      status: 'success',
      data: transactions,
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