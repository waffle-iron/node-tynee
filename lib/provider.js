"use strict";

var shortid = require('shortid');
var TyneeClient = require('tynee-client');
var EventEmitter = require('events');
var util = require('util');
var debug = require('debug')('tynee');

util.inherits(Provider, EventEmitter);

function Provider(details, redisClient) {

  EventEmitter.call(this);

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
      this.clientStatus = 'online';
    });
    this.client.on('offline', function() {
      this.clientStatus = 'offline';
    });
  } else {
    this.clientStatus = 'online';
  }
  this.id = this.name + ':' + this.version + ':' + shortid.generate();
}

Provider.prototype.refresh = function(client, host, port, cb) {

  debug(`Refreshing ${this.id}`);

  if (this.clientStatus === 'online') {

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

Provider.prototype.execute = function(params, cb) {

  var self = this;

  var message = {
    body: params.request.body.data,
    headers: params.request.headers,
    correlationId: params.request.headers['x-tynee-correlationid'],
    messageId: params.request.headers['x-tynee-messageid']
  }

  if (this.client) {
    message.invoke = function(outbound, callback) {
      self.client.invoke(outbound, params.passthru, callback);
    }
  }

  debug(`Executing provider ${this.name}:${this.version}`);

  this.service.call(params.request.app.locals, message, cb);

}

module.exports = Provider;
