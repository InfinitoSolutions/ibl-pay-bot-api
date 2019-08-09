const fs = require('fs');
const errorConfig = require('app/config/error');

module.exports = async (req, res, next) => {
  try {
    const timestamp = req.query.timestamp;
    const fileType = req.query.type !== 'undefined' ? req.query.type : 'zip';
    const filePath = `storage/export/${timestamp}-export-buyer.${fileType}`;

    if (!fs.existsSync(filePath)) {
      return next({ message: 'Your requested file does not exist.' });
    }

    return res.download(filePath);
    
  } catch (error) {
    console.error(error);
    return next({
      message: 'An internal server error occurred. Please try again later.',
      name: errorConfig.type.INTERNAL_SERVER_ERROR
    });
  }
};