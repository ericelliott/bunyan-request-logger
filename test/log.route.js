/* globals describe, before, beforeEach, after, it*/
var sinon = require('sinon');
var bunyan = require('bunyan');
var request = require('supertest');
var should = require('should');
var createDefaultApp = require('./').createDefaultApp;


describe('bunyan-request-logger log.gif', function () {
  var infoSpy;
  var app = createDefaultApp({level: bunyan.FATAL});

  before(function () {
    infoSpy = sinon.spy(bunyan.prototype, 'info');
  });

  beforeEach(function () {
    infoSpy.reset();
  });

  after(function () {
    infoSpy.restore();
  });

  describe('logging', function () {

    it('should log the request id in the response at the info level', function (done) {
      request(app)
        .get('/log.gif')
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
        .get('/log.gif')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.firstCall.args[0];
          logInfoMetadata.should.have.keys('req');
          done();
        });
    });

    it('should log the request id at the info level', function (done) {
      request(app)
        .get('/log.gif')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.firstCall.args[0];
          logInfoMetadata.req.requestId.should.be.a.String;
          logInfoMetadata.req.requestId.should.not.be.empty;

          done();
        });
    });

    it('should log the request params', function (done) {
      request(app)
        .get('/log.gif/my message')
        .end(function (err) {
          should.not.exist(err);

          var logInfoMetadata = infoSpy.firstCall.args[0];
          logInfoMetadata.req.params.msg.should.be.equal('my message');

          done();
        });
    });
  });

  describe('response', function () {
    it('should not be cached', function (done) {
      request(app)
        .get('/log.gif')
        .end(function (err, res) {
          should.not.exist(err);
          res.headers['cache-control'].should.be.equal('no-store, no-cache, must-revalidate, max-age=0');
          res.headers['pragma'].should.be.equal('no-cache');
          done();
        });
    });

    it('should be a gif image', function (done) {
      request(app)
        .get('/log.gif')
        .end(function (err, res) {
          should.not.exist(err);
          res.headers['content-type'].should.be.equal('image/gif');
          // res.headers['content-length'].should.be.equal('35');
          done();
        });
    });
  });

});
