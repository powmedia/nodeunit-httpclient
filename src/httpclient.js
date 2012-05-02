var http = require('http'),
    querystring = require('querystring'),
    underscore = require('underscore');


/**
 * @param {Object}  Options:
 *                      host ('localhost')
 *                      port (80)
 *                      path ('')       - Base path URL e.g. '/api'
 *                      headers ({})    - Test that these headers are present on every response (unless overridden)
 *                      status (null)   - Test that every response has this status (unless overridden)
 */
var HttpClient = module.exports = function(options) {
    options = options || {};
    
    this.host = options.host || 'localhost';
    this.port = options.port || 80;
    this.path = options.path || '';
    this.headers = options.headers || {};
    this.status = options.status;
}

HttpClient.create = function(options) {
    return new HttpClient(options);
}

var methods = ['get', 'post', 'head', 'put', 'del', 'trace', 'options', 'connect'];

/**
   * Performs a testable http request
   *
   * @param {Assert}
   *   Nodeunit assert object
   * @param {String} [route=undefined]
   *   http uri to test
   * @param {Object} [req=undefined]
   *   Object containing request related attributes like headers or body.
   * @param {Object} [res=undefined]
   *   Object to compare with the response of the http call
   * @param {Function} [cb=undefined]
   *   Callback that will be called after the http call. Receives the http response object.
   */
methods.forEach(function(method) {    
    HttpClient.prototype[method] = function(assert, path, req, res, cb) {
        var self = this;
        
        //Handle different signatures
        if (arguments.length == 3) {
            //(assert, path, cb)
            if (typeof req === 'function') {
                cb = req;
                req = {};
                res = {};
            }
            
            //(assert, path, res)
            else {
                cb = null;
                res = req;
                req = {};
            }
        }
        
        //(assert, path, req, cb)
        if (arguments.length == 4) {
            if (typeof res == 'function') {
                cb = res;
                res = {};
            }
        }

        //Also accepted: 
        //(assert, path, req, res)
        //(assert, path, req, res, cb)
        
        //Generate path based on base path, route path and querystring params
        var fullPath = this.path + path;

        //Don't add to querystring if POST or PUT
        if (['post', 'put'].indexOf(method) === -1) {
            var data = req.data;
            
            if (data) fullPath += '?' + querystring.stringify(data);
        }
        
        var options = {
            host: this.host,
            port: this.port,
            path: fullPath,
            method: method == 'del' ? 'DELETE' : method.toUpperCase(),
            headers: underscore.extend({}, this.reqHeaders, req.headers)
        };
        
        var request = http.request(options);
        
        //Write POST & PUTdata
        if (['post', 'put'].indexOf(method) != -1) {
            var data = req.data || req.body;
            
            if (data) {
                if (typeof data == 'object') {
                    request.setHeader('content-type', 'application/json');
                    request.write(JSON.stringify(data));
                } else {
                    request.write(data);
                }
            }
        }
        
        //Send
        request.end();
        
        request.on('response', function(response) {
            response.setEncoding('utf8');
            
            response.on('data', function(chunk) {
                if (response.body)
                    response.body += chunk;
                else
                    response.body = chunk;
            });
            
            //Handle the response; run response tests and hand back control to test
            response.on('end', function() {
                //Add parsed JSON
                var contentType = response.headers['content-type'];
                if (contentType && contentType.indexOf('application/json') != -1) {
                    if (typeof response.body != 'undefined') {
                        response.data = JSON.parse(response.body);
                    }
                }
                
                //Run tests on the response
                (function testResponse() {
                    //Can pass in falsy value to prevent running tests
                    if (!assert) return;
                    
                    //Status code
                    var status = res.status || self.status;
                    if (status) {
                        assert.equal(response.statusCode, status);
                    }

                    //Headers
                    var headers = underscore.extend({}, self.headers, res.headers);
                    for (var key in headers) {
                        assert.equal(response.headers[key], headers[key]);
                    }
                    
                    //Body
                    if (res.body) {
                        assert.equal(response.body, res.body);
                    }
                    
                    //JSON data
                    if (res.data) {
                        assert.deepEqual(response.data, res.data);
                    }
                })();
                
                
                //Done, return control to test
                if (cb)
                    return cb(response);
                else
                    return assert.done();
            });
        });
    }
});
