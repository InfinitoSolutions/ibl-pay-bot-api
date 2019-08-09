const CronJob = require('cron').CronJob;
const currenciesRateJob = require('./fetchCurrenciesRate');
const notificationOperator = require('./notificationOperator');
// const syncDbJob = require('./syncDb');

module.exports = app => {
  const cronJobFetchCurrency = new CronJob('0 */15 * * * *', () => {
    // Run each 15 minutes
    console.log('Start currencies rate fetch ', new Date());
    currenciesRateJob();
  });
  cronJobFetchCurrency.start();

  // const cronJobSyncDb = new CronJob('*/30 * * * * *', () => { // Run each 5 minutes
  //   console.log('Start cronJob sync db ', new Date());
  //   syncDbJob();
  // });
  // cronJobSyncDb.start();

  const cronJobNotificationOperator = new CronJob('*/30 * * * *', () => { 
    // Run each 30 minutes
    console.log('Start cronJob notification operator', new Date());
    notificationOperator(app);
  });

  cronJobNotificationOperator.start();
};
