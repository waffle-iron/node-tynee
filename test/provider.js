var fakeRedis = require('fakeredis');
var expect = require('chai').expect;
var Provider = require('../lib/provider');
var TyneeRequest = require('../lib/tyneerequest');

var colors = require('mocha/lib/reporters/base').colors;
colors['pass'] = '93';

describe('A Provider', function() {
  describe('when refreshing', function() {
    var client = fakeRedis.createClient({fast: true});

    it('should publish to Redis', function(done) {
      var provider = new Provider({
        name: 'foo',
        version: '1.0.0',
        service: function() { }
      }, client);
      provider.refresh(client, '127.0.0.1', 80, function(err) {
        expect(err).not.to.exist;
        client.hgetall(provider.id, function(err, data) {
          expect(data['name']).to.equal('foo');
          expect(data['version']).to.equal('1.0.0');
          expect(data['host']).to.equal('127.0.0.1');
          expect(data['port']).to.equal('80');
          done();
        });
      });
    });
  });

  describe('when executing', function() {
    var client = fakeRedis.createClient({fast: true});

    it('should execute the function', function(done) {
      var provider = new Provider({
        name: 'foo',
        version: '1.0.0',
        service: function(message, cb) {
          process.nextTick(function() {
            cb(null, message.body.bar+1);
          });
        }
      });
      
      var request = new TyneeRequest();
      request.body = { data: {bar: 1 }};
      
      provider.execute(request, function(err, value) {
        expect(value.data).to.equal(2);
        done();
      });

    });
  })
})
