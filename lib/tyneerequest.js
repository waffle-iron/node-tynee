"use strict";

function TyneeRequest() {
    this.startTime = new Date().getTime();
    this.headers = [];
    this.context = { };
    this.logs = new Set();
    this.body = { };
    this.isDebug = false;
};

TyneeRequest.prototype.log = function(text) {
    
    var ts = new Date().getTime();
    this.logs.add({ts: text});

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
    var message = {
        body: this.body.data,
        headers: this.headers,
        correlationId: this.correlationId,
        messageId: this.messageId,
        log: this.getLogger()
    };
    
    if (client) {
        message.invoke = function(outbound, cb) {
            client.invoke(outbound, this.getPassthru(), function(err, results) {
                // TODO: Get debug from these results
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
            returnValue.debug.logs = this.logs;
        }
    }
    cb(err, returnValue);
}

TyneeRequest.prototype.getPassthru = function() {
    var returnValue = {
        'x-tynee-correlationid': this.correlationId,
    };
    if (this.isDebug) {
        returnValue['x-tynee-debug'] = 1;
    }
}

module.exports = TyneeRequest;