const archiver = require('archiver');
const fs = require('fs');
const rimraf = require('rimraf');

module.exports = (folderName, options = {}, callback) => {
  let writableStream = fs.createWriteStream(`${folderName}.zip`);
  let archive = archiver('zip', { zlib: { level: 6 } });
  console.log('Start archiving');
  callback =
    typeof callback !== 'undefined'
      ? callback
      : () => {
          console.log('Finished archiving');
        };

  const promise = new Promise((resolve, reject) => {
    archive.directory(`${folderName}`, false);
    archive.finalize();
    archive.pipe(writableStream);

    writableStream.on('finish', () => {
      resolve();
    });

    writableStream.on('error', err => {
      reject(err);
    });
  });

  promise
    .then(() => {
      if (typeof options.unlinkFolder !== 'undefined' && options.unlinkFolder) {
        rimraf.sync(folderName);
      }

      callback();
    })
    .catch(err => {
      console.error(err);
      writableStream.end(callback);
    });
};
