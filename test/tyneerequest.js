var expect = require('chai').expect;
var TyneeRequest = require('../lib/tyneerequest');
var TyneeClient = require('tynee-client');
var fakeRedis = require('fakeredis');

var colors = require('mocha/lib/reporters/base').colors;
colors['pass'] = '93';

describe('A TyneeRequest', function() {
   
  describe('when creating a message', function() {
      
    it('should default to NOT debug mode', function() {
      
      var request = new TyneeRequest();
      expect(request.isDebug).to.equal(false); 
    
    });
    
    it('should set debug mode when header is present', function() {
      
      var request = new TyneeRequest();
      request.processHeaders({
        'x-tynee-debug': 1
      });
      expect(request.isDebug).to.equal(true);
      
    });

    it('should include parsed headers as properties', function() {
        
        var headers = {
            'x-tynee-debug': 1,
            'x-tynee-correlationid': 'abc123',
            'x-tynee-messageid': '123abc'
        };
        
        var request = new TyneeRequest();
        request.processHeaders(headers);
        
        var message = request.getMessage();
        expect(message.correlationId).to.equal('abc123');
        expect(message.messageId).to.equal('123abc');
        expect(message.headers).to.deep.equal(headers);
        
    });
    
    it('should extract the body from a "data" property', function() {
      
      var request = new TyneeRequest();
      request.body = {data: 'Hello'};
      
      expect(request.getMessage().body).to.equal('Hello');
      
    });
    
    it('should include a log function', function() {
      
      var request = new TyneeRequest();
      request.isDebug = true;
      
      var message = request.getMessage();
      
      expect(message.log).to.be.a.function;
      
      message.log("Step 1");
      message.log("Step 2");
      
      expect(request.logs.size).to.equal(2);
      
    });
    
    it('should not include "invoke" when not passed a client', function() {
      
      var request = new TyneeRequest();
      var message = request.getMessage();
      expect(message['invoke']).to.be.undefined;
      
    });
    
    it('should include "invoke" when passed a client', function() {
      
      var client = new TyneeClient({
        redisClient: fakeRedis.createClient({fast: true})
      });
      
      var request = new TyneeRequest();
      
      var message = request.getMessage(client);
      expect(message.invoke).to.be.a.function;
      
    });
       
  });
  
  describe('when handling results', function() {
    
    it('should place results in a "data" property', function(done) {
      
      var request = new TyneeRequest();
      request.assembleResults(null, 'World', function(err, results) {
        expect(results.data).to.equal('World');
        done();
      });
      
    });
    
    it('should include timings when in debug mode', function(done) {
      
      var request = new TyneeRequest();
      request.isDebug = true;
      
      setTimeout(function() {
        request.assembleResults(null, '', function(err, results) {
          var start = results.debug.startTime;
          var end = results.debug.endTime;
          expect(start).to.not.be.null;
          expect(end).to.not.be.null;
          expect(end).to.be.above(start);
          done();
        });
      },500);
      
    });
    
    it('should include logs when in debug mode', function(done) {
      
      var request = new TyneeRequest();
      request.isDebug = true;
      
      request.log("Step 1");
      request.log("Step 2");
      
      request.assembleResults(null, '', function(err, results) {
        var logs = results.debug.logs;
        expect(logs.length).to.equal(2);
        done();
      });
      
    });
    
  });
    
});