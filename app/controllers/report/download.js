const fs = require('fs');

module.exports = (req, res, next) => {
  const timestamp = req.query.timestamp;
  const fileType = req.query.type !== 'undefined' ? req.query.type : 'zip';
  const alias = req.query.report !== 'undefined' ? req.query.report : null;
  if (!alias) {
    return next({ message: 'The report type must be defined.' });
  }

  const filePath = `storage/export/${timestamp}-export-${alias}.${fileType}`;

  if (!fs.existsSync(filePath)) {
    return next({ message: 'Your requested file does not exist.' });
  }

  return res.download(filePath);
};