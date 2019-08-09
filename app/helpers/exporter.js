/* eslint-disable no-unused-vars */
const fs = require('fs');
const wkhtmltopdf = require('wkhtmltopdf');

const exportCsv = (type, fileName, headers, serializer, items, callback) => {
  const writableStream = fs.createWriteStream(fileName);

  return new Promise((resolve, reject) => {
    // Write CSV headers
    writableStream.write(headers.join(',') + '\r\n');

    // Loop and write each row to the CSV file
    for (let item of items) {
      writableStream.write(serializer(type, headers, item).join(',') + '\r\n');
    }

    callback = typeof callback !== 'undefined'
      ? callback
      : () => console.log('Finished exporting');

    writableStream.end(() => { 
      callback();
      resolve();
    });
  });
};

const exportPdf = (type, fileName, headers, serializer, items, callback) => {
  let html = `<html>
    <head>
      <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
      <meta charset="UTF-8" />
      <style>
      table {
        table-layout: fixed;
        width: 100%;
        border-collapse: collapse;
      }      
      table th {
        border: 1px solid #dddddd;
        text-align: left;
      }
      table td {
        border: 1px solid #dddddd;
        word-wrap: break-word;         /* All browsers since IE 5.5+ */
        overflow-wrap: break-word;     /* Renamed property in CSS3 draft spec */
      }
      .string {
        text-align: left;
      }
      .number {
        text-align: right;
      }
      </style>
    </head>
    <table>
      <tr>
        <th>${headers.join('</th><th>')}</th>
      </tr>`;
  for (let item of items) {
    html += `<tr>${serializer(type, headers, item)}</tr>`;
  }
  html += '</table></html>';

  callback = typeof callback !== 'undefined'
      ? callback
      : () => {
          console.log('Finished exporting');
        };

  return new Promise((resolve, reject) => {
    wkhtmltopdf(
      html,
      {
        pageSize: 'A1',
        orientation: 'Landscape',
        disableSmartShrinking: true,
        dpi: 300,
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        output: fileName
      },
      (err, stream) => {
        callback();
        return !err ? resolve() : reject(err);
      }
    );
  });
};

module.exports = (type, fileName, headers, serializer, items, callback) => {
  if (type === 'csv') {
    return exportCsv(type, fileName, headers, serializer, items, callback);
  }

  if (type === 'pdf') {
    return exportPdf(type, fileName, headers, serializer, items, callback);
  }

  return false;
};
