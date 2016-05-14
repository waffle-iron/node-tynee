"use strict";

var shortid = require('shortid');
var TyneeClient = require('tynee-client');
var EventEmitter = require('events');
var util = require('util');
var debug = require('debug')('tynee');

util.inherits(Provider, EventEmitter);

function Provider(details, redisClient) {

  EventEmitter.call(this);
  
  var self = this;
  
  this.name = details.name;
  this.version = details.version;
  this.service = details.service;
  if (details['dependencies']) {
    this.clientStatus = 'offline';
    this.client = new TyneeClient({
      redisClient: redisClient,
      dependencies: details['dependencies']
    });
    this.client.on('online', function() {
      debug("Client for service " + self.id + " is online");
      self.clientStatus = 'online';
    });
    this.client.on('offline', function() {
      debug("Client fo rservice " + self.id + " is offline");
      self.clientStatus = 'offline';
    });
  } else {
    this.clientStatus = 'online';
  }
  this.id = this.name + ':' + this.version + ':' + shortid.generate();
}

Provider.prototype.refresh = function(client, host, port, cb) {

  debug(`Refreshing ${this.id}`);

  if (this.clientStatus === 'online') {
    
    debug('Publishing service details for ' + this.id + ' to redis');

    var multi = client.multi();

    multi.hmset(this.id, {
      name: this.name,
      version: this.version,
      port: port,
      host: host
    });
    multi.expire(this.id, 3);
    multi.exec(cb);

  }

}

Provider.prototype.execute = function(request, cb) {

  var self = this;

  var message = request.getMessage(this.client);

  debug(`Executing provider ${this.name}:${this.version}`);

  this.service.call(request.context, message, function(err, results) {
    request.assembleResults(err, results, cb);
  });

}

module.exports = Provider;
