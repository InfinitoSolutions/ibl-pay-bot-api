const pckg = require('../../package.json');

module.exports = {
  swaggerDefinition: {
    info: {
      description: 'This is a Infinito Pay - Backoffice Tool server',
      title: 'Backoffice tool Swagger',
      version: pckg.version
    },
    basePath: '/api',
    produces: ['application/json'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: ''
      }
    }
  },
  basedir: __dirname, // app absolute path
  files: ['../routes/*.js', '../models/*.js'] // Path to the API handle folder
};
