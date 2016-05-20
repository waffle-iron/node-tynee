"use strict";

var Registry = require('./lib/registry')
  , EventEmitter = require('events')
  , redis = require('redis')
  , debug = require('debug')('tynee')
  , TyneeRequest = require('./lib/tyneerequest')
  , util = require('util');

util.inherits(Tynee, EventEmitter);

function Tynee (options) {

  EventEmitter.call(this);

  var self = this;
  this.interfaceVersion = 1;
  this.ready = false;

  options = options || {};

  if (options["redisClient"]) {
    this.redisClient = options["redisClient"];
  } else {
    options["redis"] = options["redis"] || {};
    this.redisClient = redis.createClient(options["redis"]);
  }

  this.registry = new Registry(this.redisClient);

  this.registry.on('online', function() {
    if (!self.ready) {
      self.ready = true;
      self.emit('ready');
    }
    self.emit('online');
  });
  this.registry.on('offline', function() {
    self.emit('offline');
  });

  if (options["providers"]) {
    this.registry.add(options["providers"]);
  }

};

Tynee.prototype.add = function(entries) {
  this.registry.add(entries);
};

Tynee.prototype.handler = function() {
  var self = this;
  return(function(req, res, next) {
    self._handler.call(self, req, res, next);
  });
};

Tynee.prototype._handler = function(req, res, next) {
  if (req.path.startsWith('/tynee/service')) {
    var pieces = req.path.split('/');
    var name = pieces[3];
    var version = pieces[4];
    
    var request = new TyneeRequest();
    request.processHeaders(req.headers);
    request.context = req.app.locals;
    request.body = req.body;

    var provider = this.registry.find(name, version);
    
    if (provider) {
      
      provider.execute(request, function(err, results) {
        
        if (!err) {
          res.set({
            'x-tynee-correlationid': request.correlationId,
            'x-tynee-messageid': request.messageId,
            'x-tynee-serviceid': provider.id,
          });
          if (request.isDebug) {
            res.set('x-tynee-debug', 1);
            results.debug.serviceId = provider.id;
          }
          res.json(results);
        }
        if (next) {
          next(err);
        }
      });
    }
  }
};

Tynee.prototype.publish = function(port, ip) {
  port = port || 3000;
  ip = ip || 'localhost';
  this.registry.publish(port, ip);
}

Tynee.prototype.close = function() {
  this.registry.close();
}

module.exports = Tynee;
