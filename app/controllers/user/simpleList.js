const botDb = require('app/models/bot/index');
const serializer = require('express-serializer');
const errorConfig = require('app/config/error');
const ObjectId = require('mongoose').Types.ObjectId;
const userSimpleSerializer = require('app/serializers/bot/userSimple');

module.exports = async (req, res, next) => {
  try {

    const { options: { paging: { limit, offset }, filter } } = req;

    const roles = await botDb.Role.find({ 
      name: { $ne: 'System Admin' }
    });
    const roleIds = roles.map(r => r._id);

    const query = { role: { $in: roleIds } };
    if (filter) {
      const { role, status } = filter;

      if (typeof role !== 'undefined' && role) {
        const roleIds = Array.isArray(role) ? 
          role.map(item => ObjectId(item))
          : [ObjectId(role)];
        query.role = { $in: roleIds };
      }

      if (typeof status !== 'undefined' && status) {
        query.status = filter.status;
      }
    }

    const total = await botDb.User.countDocuments(query);
    const users = await botDb.User.find(query).skip(offset).limit(limit);
    const data = await serializer(req, users, userSimpleSerializer, { includePermissions: false });
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