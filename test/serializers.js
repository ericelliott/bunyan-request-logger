var sinon = require('sinon');
var bunyan = require('bunyan');
var request = require('supertest');
var should = require('should');
var createDefaultApp = require('./').createDefaultApp;

var app = createDefaultApp();

describe('bunyan-request-logger serializers', function () {
  var emitSpy;

  before(function () {
    // we spy the emit function to know what is being sent in there after serializing
    emitSpy = sinon.stub(bunyan.prototype, '_emit');

    // hiding error output that comes from throwing errors around in our tests
    sinon.stub(console, 'error');

  });

  beforeEach(function(){
    emitSpy.reset();
  });

  after(function () {
    emitSpy.restore();
    console.error.restore();
  });

  describe('res serializer', function () {

    it('should log the correct properties when logging the response', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.secondCall.args[0];
          //will fail if there are extra properties
          emitArgs.should.have.keys('hostname', 'level', 'msg', 'name', 'pid', 'level', 'res', 'time', 'v');
          done();
        })
    });


    it('should log the correct properties for the res object when logging the response', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.secondCall.args[0];

          // will fail if there are extra properties
          emitArgs.res.should.have.keys('statusCode', 'headers', 'requestId', 'responseTime');
          done();
        })
    });
  });


  describe('res serializer', function () {

    it('should log the correct properties when logging the response', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.firstCall.args[0];
          // will fail if there are extra properties
          emitArgs.should.have.keys('hostname', 'level', 'msg', 'name', 'pid', 'level', 'req', 'time', 'v');
          done();
        })
    });


    it('should log the correct properties for the req object when logging the response', function (done) {
      request(app)
        .get('/something')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.firstCall.args[0];
          // will fail if there are extra properties
          emitArgs.req.should.have.keys('headers', 'requestId', 'url', 'method', 'protocol', 'ip');
          done();
        })
    });
  });

  describe('err serializer', function () {

    it('should log the correct properties when logging the response', function (done) {
      request(app)
        .get('/error')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.secondCall.args[0];
          // will fail if there are extra properties
          emitArgs.should.have.keys('hostname', 'level', 'msg', 'name', 'pid', 'level', 'err', 'time', 'v');
          done();
        })
    });


    it('should log the correct properties for the err object when logging the response', function (done) {
      request(app)
        .get('/error')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.secondCall.args[0];
          // will fail if there are extra properties
          emitArgs.err.should.have.keys('message', 'name', 'stack', 'code', 'signal', 'requestId');
          done();
        })
    });

    it('should not log the stack on 4xx errors', function (done) {
      request(app)
        .get('/this.does.not.exist')
        .end(function (err) {
          should.not.exist(err);

          var emitArgs = emitSpy.secondCall.args[0];
          // will fail if there are extra properties
          emitArgs.err.should.not.have.properties('stack');
          done();
        })
    });


  });

});