var fakeRedis = require('fakeredis');
var expect = require('chai').expect;
var Registry = require('../lib/registry');

var colors = require('mocha/lib/reporters/base').colors;
colors['pass'] = '93';

describe('A Registry', function() {

  describe('when publishing', function() {

    var client = fakeRedis.createClient({fast: true});

    it('should add it to Redis', function() {

      var registry = new Registry(client);

      registry.add({
        name: 'foo',
        version: '1.0.0',
        service: function() { }
      });

      registry.publish('127.0.0.1', 80);

      var provider = registry.find('foo','1.0.0');

      setTimeout(function() {
        client.hgetall(provider.id, function(err, data) {
          expect(data['name']).to.equal('foo');
          expect(data['version']).to.equal('1.0.0');
          expect(data['host']).to.equal('127.0.0.1');
          expect(data['port']).to.equal('80');
          done();
        });
      }, 600);

    });

  });

});
