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
         app.listen(3000).on('listening', function() {
             tynee.publish(3000);
         });
 
         tynee.on('ready', function() {
             
             var client = new TyneeClient({
                 redisClient: redisClient,
                 dependencies: {name: 'foo', version: '1.0.0'}
             });
             
             client.on('ready', function() {
                 
                client.invoke({ name: 'foo', body: ''}, function(err, results) {
                    expect(results.body).to.equal('bar');
                    done();
                });
                
             });
             
         });
          
      });
       
   });
    
});