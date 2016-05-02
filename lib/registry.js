"use strict";

var redis = require('redis')
  , Provider = require('./provider')
  , EventEmitter = require('events')
  , util = require('util')
  , debug = require('debug')('tynee')
  , async = require('async');

util.inherits(Registry,EventEmitter);

function Registry(redisClient) {

  EventEmitter.call(this);

  var self = this;

  this.redisClient = redisClient;
  this.providers = new Map();

  this.expireInterval = setInterval(function() {
    self._refreshProviders();
  }, 500);

};

Registry.prototype.close = function() {
  clearInterval(this.expireInterval);
}

Registry.prototype.add = function(entries) {

  var self = this;

  if (entries) {
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    for (let entry in entries) {
      var key = `${entries[entry].name}:${entries[entry].version}`;
      this.providers.set(key, new Provider(entries[entry]));
      debug(`Adding service ${key}`);
    }
  }

};

Registry.prototype.find = function(service, version) {

  var key = `${service}:${version}`;
  if (this.providers.has(key)) {
    return(this.providers.get(key));
  } else {
    return null;
  }

};

Registry.prototype.publish = function(port, ip) {
  this.ip = ip;
  this.port = port;
}

Registry.prototype._refreshProviders = function(registry) {

  var self = this;

  debug('Refreshing ' + this.providers.size + ' providers');

  if (this.ip && this.port) {

    async.each(this.providers.values(), function(provider, cb) {
      provider.refresh(self.redisClient, self.ip, self.port, cb);
    }, function(err) {
      // Emit error back to parent
    });

  }

}

module.exports = Registry;