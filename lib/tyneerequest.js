"use strict";

function TyneeRequest() {
    this.startTime = new Date().getTime();
    this.headers = [];
    this.context = { };
    this.logs = new Set();
    this.body = { };
    this.isDebug = false;
    this.calls = new Set();
};

TyneeRequest.prototype.log = function(text) {
    
    var ts = new Date().getTime();
    var entry = { }
    entry[ts] = text;
    this.logs.add(entry);

};

TyneeRequest.prototype.getLogger = function() {
    var self = this;
    var logger;
    if (this.isDebug) {
        logger = function(text) {
            self.log.call(self, text);
        };
    } else {
        logger = function() { };
    }
    return(logger);
    
}

TyneeRequest.prototype.processHeaders = function(headers) {
    
    this.isDebug = ('x-tynee-debug' in headers);
    this.correlationId = headers['x-tynee-correlationid'];
    this.messageId = headers['x-tynee-messageid'];
    this.headers = headers;
    
}

TyneeRequest.prototype.getMessage = function(client) {
    
    var self = this;
    
    var message = {
        body: this.body.data,
        headers: this.headers,
        correlationId: this.correlationId,
        messageId: this.messageId,
        log: this.getLogger()
    };
    
    if (client) {
        message.invoke = function(outbound, cb) {
            client.invoke(outbound, self.getPassthru(), function(err, results) {
                if (self.isDebug) {
                    var entry = { };
                    entry[results.headers['x-tynee-serviceid']] = results.debug;
                    self.calls.add(entry);
                }
                cb(err, results);
            });
        }
    }
    
    return(message);
    
}

TyneeRequest.prototype.assembleResults = function(err, results, cb) {
    var returnValue = {
        data: results
    };
    if (this.isDebug) {
        returnValue.debug = {
            startTime: this.startTime,
            endTime: new Date().getTime()
        }
        if (this.logs.size > 0) {
            returnValue.debug.logs = Array.from(this.logs);
        }
        if (this.calls.size > 0) {
            returnValue.debug.calls = Array.from(this.calls);
        }
    }
    cb(err, returnValue);
}

TyneeRequest.prototype.getPassthru = function() {
    var returnValue = {};
    
    returnValue["headers"] = {
        'x-tynee-correlationid': this.correlationId,
    };
    if (this.isDebug) {
        returnValue.headers['x-tynee-debug'] = 1;
    }
    return(returnValue);
}

module.exports = TyneeRequest;