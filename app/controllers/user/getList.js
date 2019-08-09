const botDb = require('app/models/bot/index');
const serializer = require('express-serializer');
const userSerializer = require('app/serializers/bot/user');
const { DIRECT_EXPORT_LIMIT, EXPORT_HEADER } = require('app/config/app');
const exporter = require('app/helpers/exporter');
const userExportSerializer = require('app/serializers/bot/export/user');
const { generateToken } = require('app/helpers/utils');
const errorConfig = require('app/config/error');
const ObjectId = require('mongoose').Types.ObjectId;
const utils = require('app/helpers/utils');

module.exports = async (req, res, next) => {
  try {
    const { options: { filter, sort, search: searchOption, paging } } = req;
    const search = utils.trimString(searchOption);
    let aggregates = initPipeline();

    if (typeof filter !== 'undefined' && filter) {
      aggregates.push(...createFilter(filter));
    }

    if (typeof search !== 'undefined' && search) {
      aggregates.push(...createSearch(search));
    }
  
    if (typeof sort !== 'undefined' && sort) {
      aggregates.push(...createSort(sort));
    }

    req.query.export = typeof req.query.export === 'undefined' 
      ? false 
      : req.query.export;
    req.query.exportType = typeof req.query.exportType === 'undefined'
      ? 'csv'
      : req.query.exportType;
    if (req.query.export === true || req.query.export === 'true') {
      return exportUsers(req, res, aggregates);
    } 
    const { limit, offset } = paging;
    aggregates.push({
      $facet: {
        count: [{ $count: 'total' }],
        users: [{ $skip: offset }, { $limit: limit }]
      }
    });

    const [{ users, count }] = await botDb.User.aggregate(aggregates).exec();
    const data = await serializer(req, users, userSerializer, { includePermissions: false });
    const total = count && count.length ? count[0].total : 0;

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

const exportUsers = async (req, res, aggregates) => {
  const { query: { exportType }, user } = req;
  let countAggregates = aggregates.slice(); 
  countAggregates.push({ $count: 'total' });
  let results = await botDb.User.aggregate(countAggregates).exec();
  const total = typeof results[0].total !== 'undefined' ? parseInt(results[0].total) : 0;
  const headers = EXPORT_HEADER.USER;

  // If the total is greater than our limit for direct export, we need to add the task to background job through message queue
  if (total >= DIRECT_EXPORT_LIMIT) {
    res.app.emit('BackgroundExportRequested', req, res, {
      app: 'bot',
      model: 'User',
      type: exportType,
      query: aggregates,
      plural: 'users',
      total: total,
      headers,
      user: {
        email: user.email,
        first_name: user.first_name,
        id: user._id.toString(),
        role_id: user.role._id
      }
    });

    return res.json({
      status: 'success',
      message:
        'The request was added to queue and will be processed in background. Zip files will be sent to your email address'
    });
  }
  const users = await botDb.User.aggregate(aggregates).exec();
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const fileName = `storage/export/${currentTimestamp}-export-user.${req.query.exportType}`;
  const exporterCallback = () => {
    console.log(
      `Finish exporting to ${req.query.fileType} from row 0 to ${total}`
    );
    const downloadToken = generateToken(user, { download: true });

    return res.jsend({
      file: `${process.env.API_HOST}/api/users/download` + 
        `?timestamp=${currentTimestamp}&token=${downloadToken}&type=${req.query.exportType}`
    });
  };

  exporter(exportType, fileName, headers, userExportSerializer, users, exporterCallback);
};

const initPipeline = () => {
  const pipeline = [
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'role'
      }
    },
    {
      $unwind: { path: '$role', preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'created_by',
        foreignField: '_id',
        as: 'created_by'
      }
    },
    {
      $unwind: { path: '$created_by', preserveNullAndEmptyArrays: true }
    }
  ];
  return pipeline;
};

const createFilter = filter => {
  const { role, createdBy, status } = filter;
  let pipeline = [];

  if (typeof role !== 'undefined' && role) {
    const roleIds = Array.isArray(role) ? 
      role.map(item => ObjectId(item))
      : [ObjectId(role)];
    pipeline.push({
      $match: {
        $expr: {
          $in: ['$role._id', roleIds]
        }
      }
    });
  }

  if (typeof createdBy !== 'undefined' && createdBy) {
    pipeline.push({
      $match: {
        'created_by._id': ObjectId(createdBy)
      }
    });
  }

  if (typeof status !== 'undefined' && status ) {
    pipeline.push({ $match: { status } });
  }
  return pipeline;
};

const createSearch = search => {
  const regex = new RegExp(search, 'i');
  let pipeline = [];

  pipeline.push(
    { $match: { $or: [{ full_name: regex }, { email: regex }] } }
  );

  return pipeline;
};

const createSort = sort => {
  let pipeline = [];
  if (typeof sort !== 'undefined' && sort) {
    const sortType = sort.sortType === 'ASC' ? 1 : -1;
    if (mapField[sort.sortBy]) {
      pipeline.push({ $sort: { [mapField[sort.sortBy]]: sortType } });
    }
  } else {
    pipeline.push({ $sort: { 'full_name': 1 } });
  }
  return pipeline;
};

const mapField = {
  NAME: 'full_name',
  ROLE: 'role.name',
  EMAIL: 'email',
  STATUS: 'status',
  CREATED_DATE: 'createdAt',
  CREATED_BY: 'created_by.full_name'
};