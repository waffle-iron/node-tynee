var fakeRedis = require('fakeredis');
var expect = require('chai').expect;
var Tynee = require('../index');
var express = require('express');

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
                 process.nextTime(function() {
                     callback(null, 'bar');
                 });
             }
         });
         
         tynee.on('ready', function() {
             done();
         });
         
         tynee.publish();
          
      });
       
   });
    
});