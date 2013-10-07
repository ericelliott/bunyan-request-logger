var express = express = require('express'),
  logger = require('../request-logger.js'),
  noCache = require('connect-cache-control'),
  log = logger(),
  app = express(),
  port = 3000;

app.use( log.requestLogger() );

// Route to handle client side log messages.
//
// Counter to intuition, client side logging
// works best with GET requests.
// 
// AJAX POST sends headers and body in two steps,
// which slows it down.
// 
// This route prepends the cache-control
// middleware so that the browser always logs
// to the server instead of fetching a useless
// OK message from its cache.
app.get('/log', noCache,
    function logHandler(req, res) {

  // Since all requests are automatically logged,
  // all you need to do is send the response:
  res.send(200);
});

app.listen(port, function () {
  log.info('Listening on port ' + port);
});
