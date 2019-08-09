const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');
const swaggerConfig = require('app/config/swagger');
const cronJob = require('app/cronJob');
require('dotenv').config();
require('express-jsend');
require('console-info');
require('console-error');
require('console-warn');
const registerEvents = require('app/events/register');

// Include our custom middlewares
const errorHandler = require('app/middlewares/errorHandler');

// Initialize Express
const app = express();

// Trust proxy when behind nginx
app.enable('trust proxy');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Set logger
app.use(logger('dev'));
// Set cors
app.use(cors());
// Set body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/version', (req, res) =>
  res.json({ version: require('./package.json').version })
);
// Register routes
app.use('/', require('app/routes'));

// Register events
registerEvents(app);

// Swagger
const env = process.env.NODE_ENV;
console.warn(env);
if (env !== 'production') {
  const expressSwagger = require('express-swagger-generator')(app);
  expressSwagger(swaggerConfig);
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use(errorHandler);

// schedule cronjob
cronJob(app);

module.exports = app;
