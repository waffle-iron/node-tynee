# node-tynee
A Node.js implementation of the Tynee microservice framework

[![Build Status](https://travis-ci.org/Tynee/node-tynee.svg?branch=master)](https://travis-ci.org/Tynee/node-tynee)
[![npm version](https://badge.fury.io/js/tynee.svg)](https://badge.fury.io/js/tynee)

** Currenly under development **

```
var Tynee = require('tynee');

var app = require('express')();
var bodyParser = require('body-parser');

app.locals.incrementValue = 5;

var tynee = new Tynee({
  redis: {
    port: 32768
  }
});

tynee.add({
  name: 'incrementer',
  version: '1.0.0',
  service: function(message, callback) {
    var incr = this.incrementValue;
    process.nextTick(function() {
      callback(null, message.body + incr);
    });
  }
});

app.use(bodyParser.json());
app.use(tynee.handler());
app.listen(3000).on('listening', function() {
  tynee.publish(3000);
});
```
