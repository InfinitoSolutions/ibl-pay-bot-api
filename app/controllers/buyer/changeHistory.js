const serializer = require('express-serializer');
const changeHistorySerializer = require('app/serializers/bot/changeHistory');
const botDb = require('app/models/bot');
const errorConfig = require('app/config/error');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = async (req, res, next) => {
  try {
    const {
      query: { limit, offset }
    } = req;
    const query = { buyer_id: ObjectId(req.params.id) };
    const options = {
      sort: { createdAt: -1 },
      populate: [{
        path: 'changed_by',
        select: ['first_name', 'last_name', 'full_name', 'email', 'role'],
      }],
      offset: Number(offset),
      limit: Number(limit)
    };

    const { total, docs } = await botDb.ChangeHistory.paginate(query, options);

    const data = await serializer(req, docs, changeHistorySerializer);

    return res.json({
      status: 'success',
      data,
      paging: {
        limit,
        offset,
        total: total
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