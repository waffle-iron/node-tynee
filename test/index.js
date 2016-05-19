var fakeRedis = require('fakeredis');
var expect = require('chai').expect;
var Tynee = require('../index');
var express = require('express');
var bodyParser = require('body-parser');
var TyneeClient = require('tynee-client');

describe('A Tynee Server', function() {
   
   describe('when publishing', function() {
      
      it('should emit a "ready" event', function(done) {
         
         var tynee = new Tynee({
             redisClient: fakeRedis.createClient()
         });
         
         tynee.add({
             name: 'foo',
             version: '1.0.0',
             service: function(m, cb) {
                 process.nextTick(function() {
                     callback(null, 'bar');
                 });
             }
         });
         
         tynee.on('ready', function() {
             done();
         });
         
         tynee.publish();
          
      });
      
      it('should emit an "online" event', function(done) {
                   
         var tynee = new Tynee({
             redisClient: fakeRedis.createClient()
         });
         
         tynee.add({
             name: 'foo',
             version: '1.0.0',
             service: function(m, cb) {
                 process.nextTick(function() {
                     callback(null, 'bar');
                 });
             }
         });
         
         tynee.on('online', function() {
             done();
         });
         
         tynee.publish();
          
      });
       
   });
   
   describe('when used as express middleware', function() {
      
      it('should handle a request', function(done) {
         
         var app = express();
         
         var redisClient = fakeRedis.createClient();
         
         var tynee = new Tynee({
             redisClient: redisClient
         });
         
         tynee.add({
             name: 'foo',
             version: '1.0.0',
             service: function(m, cb) {
                 process.nextTick(function() {
                     cb(null, 'bar');
                 });
             }
         });
         
         app.use(bodyParser.json());
         app.use(tynee.handler());
         var server = app.listen(3000);
         server.on('listening', function() {
             tynee.publish(3000);
         });
 
         tynee.on('ready', function() {
             
             var client = new TyneeClient({
                 redisClient: redisClient,
                 dependencies: {name: 'foo', version: '1.0.0'}
             });
             
             client.on('ready', function() {
                 
                client.invoke({ name: 'foo'}, function(err, results) {
                    expect(results.body).to.equal('bar');
                    expect(results["debug"]).to.not.exist;
                    server.close();
                    done();
                });
                
             });
             
         });
          
      });
      
      it('should handle cascading debug info', function(done) {
          
         this.timeout(3000);
         
         var redisClient = fakeRedis.createClient();
         
         var app = express();
         
         var tynee = new Tynee({
             redisClient: redisClient
         });
         
         tynee.add({
             name: 'foo',
             version: '1.0.0',
             service: function(m, cb) {
                 process.nextTick(function() {
                     m.log("Returning 'bar' for this request");
                     cb(null, 'bar');
                 });
             }
         });
         
         app.use(bodyParser.json());
         app.use(tynee.handler());
         var server = app.listen(3000);
         server.on('listening', function() {
             tynee.publish(3000);
         });
 
         tynee.on('ready', function() {
            
            var app2 = express();
            
            var tynee2 = new Tynee({
                redisClient: redisClient
            });
            
            tynee2.add({
                name: 'baz',
                version: '1.0.0',
                dependencies: { name: 'foo', version: '1.0.0' },
                service: function(m, cb) {
                    m.invoke({name: 'foo'}, function(err, results) {
                        m.log("Adding 'baz'");
                        cb(null, results.body + 'baz'); 
                    });
                }
            });
            
            app2.use(bodyParser.json());
            app2.use(tynee2.handler());
            var server2 = app2.listen(3001);
            server2.on('listening', function() {
                tynee2.publish(3001);
            });
            
            tynee2.on('ready', function() {
             
                var client = new TyneeClient({
                    redisClient: redisClient,
                    dependencies: {name: 'baz', version: '1.0.0'}
                });
                
                client.on('ready', function() {
                    
                    client.invoke({ name: 'baz', debug: true }, function(err, results) {
                        expect(results.body).to.equal('barbaz');
                        expect(results["debug"]).to.exist;
                        expect(results["debug"]["logs"].length).to.equal(1);
                        server.close();
                        server2.close();
                        done();
                    });
                    
                });
            });
             
         });
          
      });
       
   });
    
});
