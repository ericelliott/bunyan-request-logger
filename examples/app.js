'use strict';

var express = require('express'),
  logger = require('../request-logger.js'),
  noCache = require('connect-cache-control'),
  errorHandler = require('express-error-handler'),
  log = logger(),
  app = express(),
  env = process.env,
  port = env.myapp_port || 3000,
  http = require('http'),
  server;

app.use( log.requestLogger() );

// Route to handle client side log messages.
//
// This route prepends the cache-control
// middleware so that the browser always logs
// to the server instead of fetching a useless
// OK message from its cache.
// 
// Using a 1x1 transparent gif allows you to
// use the logger in emails or embed the tracking
// pixel on third party sites without resorting
// to JavaScript.
app.get( '/log.gif', noCache, log.route() );

// Route that triggers a sample error:
app.get('/error', function createError(req,
    res, next) {
  var err = new Error('Sample error');
  err.status = 500;
  next(err);
});

// Log request errors:
app.use( log.errorLogger() );

// Create the server object that we can pass
// in to the error handler:
server = http.createServer(app);

// Respond to errors and conditionally shut
// down the server. Pass in the server object
// so the error handler can shut it down
// gracefully:
app.use( errorHandler({server: server}) );

server.listen(port, function () {
  log.info('Listening on port ' + port);
});
