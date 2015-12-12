/* globals describe, before, beforeEach, after, it*/
var sinon        = require('sinon');
var bunyan       = require('bunyan');
var logger       = require('../request-logger.js');
var express      = require('express');
var request      = require('supertest');
var should       = require('should');
var errorHandler = require('express-error-handler');
var noCache      = require('connect-cache-control');


/**
 * Creates a default app that uses the request logger and has an endpoint
 * at /something that should return a 200 OK
 * and an error endpoint that throws a new error.
 * The app uses express-error-handler so that 404 become errors and are captured
 * in the error log.
 */
function createDefaultApp(loggerOptions) {
  var log = logger(loggerOptions);
  var app = express();

  app.use(log.requestLogger());


  app.get('/something', function returnSomething(req, res) {
    res.send('Hello World!');
  });

  app.get('/slow-response', function slowResponse(req, res) {
    setTimeout(function() {
      res.send('Hello response timer');
    }, 100);
  });

  // Route that triggers a sample error:
  app.get('/error', function createError() {
    throw new Error('Sample error');
  });

  app.get( '/log.gif', noCache, log.route() );

  app.get( '/log.gif/:msg', noCache, log.route() );


  app.use(errorHandler.httpError(404));

  // Log request errors:
  app.use(log.errorLogger());

  return app;
}

describe('bunyan-request-logger', function () {
  var infoSpy;
  var errorSpy;
  var app = createDefaultApp({level: bunyan.FATAL});

  before(function () {
    infoSpy = sinon.spy(bunyan.prototype, 'info');
    errorSpy = sinon.spy(bunyan.prototype, 'error');

    // hide console errors while running the tests
    sinon.stub(console, 'error');
  });

  beforeEach(function () {
    infoSpy.reset();
    errorSpy.reset();
  });

  after(function () {
    infoSpy.restore();
    console.error.restore();
  });

  describe('info logging', function () {

    it('should call info twice per request', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          infoSpy.calledTwice.should.be.true;
          done();
        });
    });

    it('should call info twice per request that returns HTTP 500 error', function (done) {
      request(app)
        .get('/error')
        .end(function (err) {
          should.not.exist(err);

          infoSpy.calledTwice.should.be.true;
          done();
        });
    });

    it('should call info twice per request that returns a HTTP 404 not found', function (done) {
      request(app)
        .get('/does.not.exist')
        .end(function (err) {
          should.not.exist(err);

          infoSpy.calledTwice.should.be.true;
          done();
        });
    });


    it('should log the response at the info level', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.secondCall.args[0];
          logInfoMetadata.should.have.properties('res');
          done();
        });
    });

    it('should log the response time at the info level', function (done) {
      request(app)
        .get('/slow-response')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.secondCall.args[0];
          logInfoMetadata.res.responseTime.should.be.a.Number;
          logInfoMetadata.res.responseTime.should.be.aboveOrEqual(100);
          done();
        });
    });

    it('should log the request id in the response at the info level', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.secondCall.args[0];
          logInfoMetadata.res.requestId.should.be.a.String;
          logInfoMetadata.res.requestId.should.not.be.empty;
          done();
        });
    });

    it('should log the request at the info level', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.firstCall.args[0];
          logInfoMetadata.should.have.keys('req');
          done();
        });
    });

    it('should log the request id at the info level', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.firstCall.args[0];
          logInfoMetadata.req.requestId.should.be.a.String;
          logInfoMetadata.req.requestId.should.not.be.empty;

          done();
        });
    });

    it('should log the same request id for the request and response', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var reqMetadata = infoSpy.firstCall.args[0];
          var resMetadata = infoSpy.secondCall.args[0];
          reqMetadata.req.requestId.should.equal(resMetadata.res.requestId);

          done();
        });
    });
  });

  describe('error logging', function () {
    it('should not call error on a simple request', function (done) {

      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          errorSpy.called.should.be.false;
          done();
        });
    });

    it('should call error once on a error on an endpoint that returns 500', function (done) {
      request(app)
        .get('/error')
        .end(function (err) {
          should.not.exist(err);

          errorSpy.calledOnce.should.be.true;
          done();
        });
    });

    it('should call error once on a error on a 404 when using error handler', function (done) {
      request(app)
        .get('/this.does.not.exist')
        .end(function (err) {
          should.not.exist(err);

          errorSpy.calledOnce.should.be.true;
          done();
        });
    });
  });


});

exports.createDefaultApp = createDefaultApp;
