const userSerializer = require('./user');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, activityLog, options) => {
  if (typeof activityLog === 'undefined' || !activityLog) {
    return null;
  }
  let item = {
    id: activityLog.id,
    change_description: activityLog.data.info.explanation,
    date: activityLog.updated_at
  };
  if (typeof activityLog.changedBy !== 'undefined' && activityLog.changedBy) {
    item.changedBy = await userSerializer(req, activityLog.changedBy);
  } else {
    item.changedBy = null;
  }
  return item;
};
