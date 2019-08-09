const indicative = require('indicative');
const ObjectId = require('mongoose').Types.ObjectId;
const errorConfig = require('app/config/error');
const Transaction = require('app/models/buyer/transaction');
const axios = require('axios');
require('dotenv').config();
const ACCEPTED_STATUSES = [
  'PENDING',
  'APPROVED',
  'PROCESSING',
  'BLOCKED',
  'REJECTED'
];
const INVALID_MESSAGES = {
  PENDING:
    'One or more of the transactions you selected already have Pending status. Please check your selection again.',
  BLOCKED:
    'One or more of the transactions you selected already have Blocked status. Please check your selection again.',
  REJECTED:
    'One or more of the transactions you selected already have Rejected status. Please check your selection again.',
  APPROVED:
    'One or more of the transactions you selected already have Approved status. Please check your selection again.',
  PROCESSING:
    'All transactions you selected must have Approved status. Please check your selection again.',
  INVALID:
    "Status field must be one in 'PENDING,APPROVED,PROCESSING,BLOCKED,REJECTED'."
};

indicative.validations.exists = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    let value = get(data, field);
    if (!value && value !== 0) {
      return resolve();
    }

    const queryField = typeof args[2] !== 'undefined' ? args[2] : '_id';
    const model = require(`app/models/${args[0]}/${args[1]}`);
    if (queryField === '_id') {
      try {
        value = ObjectId(value);
      } catch (e) {
        return reject(message);
      }
    }

    model.findOne({ [queryField]: value }, (error, object) => {
      error || !object ? reject(message) : resolve();
    });
  });
};

indicative.validations.listExists = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    let values = get(data, field);
    if (!values && values !== 0) {
      return resolve();
    }

    const queryField = typeof args[2] !== 'undefined' ? args[2] : '_id';
    const model = require(`app/models/${args[0]}/${args[1]}`);
    if (!Array.isArray(values)) {
      values = [values];
    }

    if (queryField === '_id') {
      try {
        values = values.map(value => ObjectId(value));
      } catch (e) {
        return reject(message);
      }
    }

    model.find({ [queryField]: { $in: values } }, (error, object) => {
      error || !object.length ? reject(message) : resolve();
    });
  });
};

indicative.validations.unique = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    let value = get(data, field);
    if (!value && value !== 0) {
      return resolve();
    }

    const queryField = typeof args[2] !== 'undefined' ? args[2] : '_id';
    const model = require(`app/models/${args[0]}/${args[1]}`);
    if (queryField === '_id') {
      value = ObjectId(value);
    }

    model.findOne({ [queryField]: value }, (error, object) => {
      error || object ? reject(message.replace('%value', value)) : resolve();
    });
  });
};

indicative.validations.notStartsWith = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    const value = get(data, field);
    if (value && value.length) {
      value[0] !== args[0] ? resolve() : reject(message);
    } else {
      resolve();
    }
  });
};

indicative.validations.notEndsWith = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    const value = get(data, field);
    if (value && value.length) {
      value[value.length - 1] !== args[0] ? resolve() : reject(message);
    } else {
      resolve();
    }
  });
};

indicative.validations.excludes = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    const value = get(data, field);
    if (value && value.length) {
      value.includes(args[0]) ? reject(message) : resolve();
    } else {
      resolve();
    }
  });
};

indicative.validations.tranStatusChange = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    let values = get(data, field);

    if (typeof values !== 'undefined' && values && values.length) {
      const status = data.status;
      if (!ACCEPTED_STATUSES.includes(status)) {
        reject(new Error(INVALID_MESSAGES.INVALID));
      } else {
        // Check validate rule when change status
        const ids = values.map(v => ObjectId(v));

        if (status === 'PROCESSING') {
          // Check if all transactions have APPROVED status
          Transaction.countDocuments({
            _id: { $in: ids },
            bot_status: 'APPROVED'
          })
            .then(count => {
              if (count < ids.length) {
                reject(new Error(INVALID_MESSAGES.PROCESSING));
              } else {
                resolve();
              }
            })
            .catch(err => {
              console.error(err);
              reject(message);
            });
        } else {
          // Check if one or more transactions has final-status(REJECTED, APPROVED),
          // which can not be changed to another status
          Transaction.countDocuments({
            _id: { $in: ids },
            bot_status: 'APPROVED'
          })
            .then(count => {
              // If there is one or more approved transaction
              if (count > 0) {
                reject(new Error(INVALID_MESSAGES.APPROVED));
              } else {
                // Check rejected transactions
                Transaction.countDocuments({
                  _id: { $in: ids },
                  bot_status: ''
                })
                  .then(count => {
                    if (count > 0) {
                      reject(new Error(INVALID_MESSAGES.REJECTED));
                    } else {
                      // If change status of pending/blocked transactions to existing status
                      if (status === 'PENDING' || status === 'BLOCKED') {
                        Transaction.countDocuments({
                          _id: { $in: ids },
                          bot_status: status
                        })
                          .then(count => {
                            if (count > 0) {
                              reject(new Error(INVALID_MESSAGES[status]));
                            } else {
                              resolve();
                            }
                          })
                          .catch(err => {
                            console.error(err);
                            reject(message);
                          });
                      } else {
                        resolve();
                      }
                    }
                  })
                  .catch(err => {
                    console.error(err);
                    reject(message);
                  });
              }
            })
            .catch(err => {
              console.error(err);
              reject(message);
            });
        }
      }
    } else {
      reject(message);
    }
  });
};

indicative.validations.recaptcha = (data, field, message, args, get) => {
  return new Promise((resolve, reject) => {
    const value = get(data, field);

    axios({
      method: 'post',
      url: process.env.GOOGLE_RECAPTCHA_VERIFY_URL,
      params: {
        secret: process.env.GOOGLE_RECAPTCHA_SECRET,
        response: value
      }
    }).then(response => {
      response.data.success ? resolve() : reject(message);
    });
  });
};

module.exports = options => {
  options.validationType =
    typeof options.validationType !== 'undefined'
      ? options.validationType
      : 'validateAll';
  options.component =
    typeof options.component !== 'undefined' ? options.component : 'body';
  options.rules = typeof options.rules !== 'undefined' ? options.rules : {};
  options.messages =
    typeof options.messages !== 'undefined' ? options.messages : {};

  return (req, res, next) => {
    indicative[options.validationType](
      req[options.component],
      options.rules,
      options.messages
    )
      .then(() => {
        next();
      })
      .catch(errors => {
        next({ name: errorConfig.type.VALIDATION_ERROR, errors: errors });
      });
  };
};
