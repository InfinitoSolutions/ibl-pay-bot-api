const axios = require('axios');
const botDb = require('app/models/bot');

const FIATS = ['USD', 'VND'];
const CRYPTOS = ['NEO', 'BTC', 'ETH'];
const cryptoParam = CRYPTOS.join();

module.exports = async () => {
  try {
    for (let f = 0; f < FIATS.length; f++) {
      let fiat = FIATS[f];

      const options = {
        url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        method: 'get',
        headers: { 'X-CMC_PRO_API_KEY': `${process.env.CMC_API_KEY}` },
        params: {
          symbol: cryptoParam,
          convert: fiat
        }
      };

      const { data: { data } } = await axios(options);
          // Save prices to BOT DB
      for (let c = 0; c < CRYPTOS.length; c++) {
        let crypto = CRYPTOS[c];
        let pair = `${fiat}-${crypto}`;
        let price = data[crypto].quote[fiat].price;

        await botDb.CurrencyRate.findOneAndUpdate({ pair }, { rate: price }, { upsert: true });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};
