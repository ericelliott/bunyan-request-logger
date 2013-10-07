'use strict';

var
  // Lightweight logging library:
  bunyan = require('bunyan'),

  // For the request ID:
  cuid = require('cuid'),

  // For object property overrides:
  mixIn = require('mout/object/mixIn'),

  /**
   * Get long stack traces for the error logger.
   * @param  {error} err Error object
   * @return {string}    Stack trace
   */
  getFullStack = function getFullStack(err) {
    var ret = err.stack || err.toString(),
      cause;

    if (err.cause && typeof (err.cause) === 
        'function') {
      cause = err.cause();
      if (cause) {
        ret += '\nCaused by: ' +
          getFullStack(cause);
      }
    }
    return ret;
  },

  // To create a custom Bunyan serializer,
  // just return the desired object
  // serialization.
  // 
  // Regardless of your serialization settings,
  // all bunyan messages automatically include:
  // 
  // * App name
  // * hostname
  // * pid (Process ID)
  // * Log level
  // * Whatever object you pass in to be logged
  // * An optional message (default: empty string)
  // * Timestamp
  // * Log format version number
  serializers = {
    req: function reqSerializer(req) {
      if (!req || !req.connection) {
        return req;
      }

      return {
        url: req.url,
        method: req.method,
        protocol: req.protocol,
        requestId: req.requestId,

        // In case there's a proxy server:
        ip: req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress,
        headers: req.headers
      };
    },
    res: function resSerializer(res) {
      if (!res) {
        return res;
      }

      return {
        statusCode: res.statusCode,
        headers: res._header,
        requestId: res.requestId,
        responseTime: res.responseTime
      };
    },
    err: function errSerializer(err) {
      if (!err || !err.stack) {
        return err;      
      }

      return {
          message: err.message,
          name: err.name,
          stack: getFullStack(err),
          code: err.code,
          signal: err.signal,
          requestId: err.requestId
      };    
    }
  },

  // Bunyan offers lots of other options,
  // including extensible output stream types.
  // 
  // You might be interested in
  // node-bunyan-syslog, in particular.
  defaults = {
    name: 'unnamed app',
    serializers: mixIn({}, bunyan.stdSerializers,
      serializers)
  },

  /**
   * Take bunyan options, monkey patch request
   * and response objects for better logging,
   * and return a logger instance.
   * 
   * @param  {Object} options See bunyan docs
   * @return {Object} logger  See bunyan docs
   * @return {Function} logger.requestLogger
   *                    (See below)
   */
  createLogger = function (options) {
    var settings = mixIn({}, defaults, options),
      log = bunyan.createLogger(settings);

    log.requestLogger = function
        createRequestLogger() {

      return function requestLogger(req, res,
          next) {

        // Used to calculate response times:
        var startTime = new Date();

        // Add a unique identifier to the request.
        req.requestId = cuid();

        // Log the request
        log.info({req: req});

        // Make sure responses get logged, too:
        req.on('end', function () {
          res.responseTime = new Date() - startTime;
          res.requestId = req.requestId;
          log.info({res: res});
        });

        next();
      };
    };

    log.errorLogger = function
        createErrorLogger() {

      return function errorLogger(err, req, res,
          next) {

        // Add the requestId so we can link the
        // error back to the originating request.
        err.requestId = req.requestId;

        log.error({err: err});
        next(err);
      };
    };

    return log;
  };

module.exports = createLogger;
