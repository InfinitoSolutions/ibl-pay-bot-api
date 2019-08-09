const botDb = require('app/models/bot');
const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');
const { TRANSACTION_TYPE } = require('app/config/app');

module.exports = async (req, res, next) => {
  try {
    const { query: { tranType, limit, offset, listStatus, txnId }, params: { id: buyerId } } = req;

    const buyer = await buyerDb.User.findById(ObjectId(buyerId));
    if (!buyer) {
      return next({
        message: {
          title: 'Account is not found',
        }
      });
    }

    const query = {
      $or: [
        { 'from.origin_id': ObjectId(buyerId) },
        { 'to.origin_id': ObjectId(buyerId) }
      ]
    };

    if (listStatus && Array.isArray(listStatus)){
      query.bot_status = { $in: listStatus };
    } else {
      query.bot_status = { $ne: null };
    }

    if (TRANSACTION_TYPE[tranType]) query.tran_type = TRANSACTION_TYPE[tranType];

    const options = { lean: true, sort: { created_at: -1 } };
    if (limit) options.limit = Number(limit);
    if (offset) options.offset = Number(offset);
    
    if (txnId && offset === 'undefined') {
      const trans = await botDb.Transaction.find(query, null, { sort : { created_at: -1 } });
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

    const { docs, total } = await botDb.Transaction.paginate(query, options);
  
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