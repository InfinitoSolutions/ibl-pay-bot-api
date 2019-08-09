const buyerDb = require('app/models/buyer');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const buyerId = req.params.id;

    const aggregate = [
      {
        // Query buyer wallets
        $lookup: {
          from: 'wallets',
          localField: '_id',
          foreignField: 'user_id',
          as: 'wallets'
        }
      },
      {
        $match: { _id: ObjectId(buyerId) }
      }
    ];

    const buyers = await buyerDb.User.aggregate(aggregate).exec();

    if (typeof buyers === 'undefined' || !buyers || buyers.length === 0) {
      return next({
        message: 'User not found',
        name: errorConfig.type.NOT_FOUND_ERROR
      });
    }

    const buyer = buyers[0];

    // const data = await serializer(req, buyer, userSerializer)

    res.jsend(buyer);
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};