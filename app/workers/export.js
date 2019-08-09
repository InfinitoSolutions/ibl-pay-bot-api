const { PER_FILE_EXPORT_LIMIT, JWT_EXPORT_FILE_EXPIRE_TIME } = require('app/config/app');
const rabbitmq = require('app/helpers/rabbitmq');
const exporter = require('app/helpers/exporter');
const { generateToken } = require('app/helpers/utils');
const zip = require('app/helpers/zip');
const fs = require('fs');
const moment = require('moment');

module.exports = async (message, channel) => {
  try {
    const data = JSON.parse(message.content.toString(), (key, value) => {
      if (value && value.toString().indexOf('__REGEXP ') === 0) {
        const m = value.split('__REGEXP ')[1].match(/\/(.*)\/(.*)?/);
        return new RegExp(m[1], m[2] || '');
      }
  
      if (moment(value, moment.ISO_8601).isValid()) {
        return new Date(value);
      }
  
      return value;
    });
    const { model, database, type, total, headers, pipeline, user, plural, alias } = data;
    
    const key = alias ? alias.toLowerCase() : model.toLowerCase();
    const serializer = require(`app/serializers/${database}/export/${key}`);
  
    const currentTimestamp = Math.floor(Date.now() / 1000);
  
    const folderName = `storage/export/${currentTimestamp}-export-${key}`;
  
    const db = require(`app/models/${database}`);
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  
    console.info(`Start exporting model ${model}:`);
    const exportPromises = [];
    
    for (let i = 0; i < total; i += PER_FILE_EXPORT_LIMIT) {
      // Add limit & offset and query
      const pipelineExecute = pipeline.slice();
      pipelineExecute.push({
        $facet: {
          docs: [{ $skip: i }, { $limit: PER_FILE_EXPORT_LIMIT }]
        }
      });
      const [{ docs: items }] = await db[model].aggregate(pipelineExecute).allowDiskUse(true);
      const start = i + 1;
      const end = i + PER_FILE_EXPORT_LIMIT >= total ? 
        total
        : i + PER_FILE_EXPORT_LIMIT;
  
      exportPromises.push(
        exporter(
          data.type,
          `${folderName}/${start}-${end}.${data.type}`,
          headers,
          serializer,
          items,
          async () => {
            console.info(`Finished exporting to ${type} from row ${start} to ${end}`);
          }
        )
      );
    }
  
    Promise.all(exportPromises)
      .then(() => {
        // Send acknowledgements back to the queue producer
        console.info(`Finished exporting model ${model}`);
        // await new Promise(resolve => setTimeout(resolve, 1000))
        zip(folderName, { unlinkFolder: true }, async () => {
          console.info('Finished creating archive for the exported results');
  
          const downloadToken = generateToken(user, { download: true, zip: JWT_EXPORT_FILE_EXPIRE_TIME });
  
          let downloadUrl = `${process.env.API_HOST}/api/${plural}/download` + 
            `?timestamp=${currentTimestamp}&token=${downloadToken}&type=zip`;
          if (plural === 'reports') {
            downloadUrl += `&report=${key}`;
          }
  
          await rabbitmq.send(
            'sendEmail',
            JSON.stringify({
              to: user.email,
              template: 'exportFile',
              params: {
                firstName: data.user.first_name,
                downloadUrl: downloadUrl
              }
            })
          );
          channel.ack(message);
        });
      })
      .catch(error => {
        console.error(error);
        channel.ack(message);
      });
  } catch (error) {
    console.error(error);
    channel.ack(message);
  }
};
