nodeunit-httpclient
===================

HTTP response testing for NodeUnit

Usage
-----

    //Setup client with automatic tests on each response
    var api = require('nodeunit-httpclient').create({
        port: 3000,
        path: '/api',   //Base URL for requests
        status: 200,    //Test each response is OK (can override later)
        headers: {      //Test that each response must have these headers (can override later)
            'content-type': 'application/json'  )
        }
    });
    
    //Automatic tests on response object
    exports.test1 = function(test) {
        api.get(test, '/user/nonexistent', {
            status: 404,
            headers: { 'content-type': 'text/plain' },
            body: 'Not found'
        })
    };

    //Test a response
    exports.test2 = function(test) {
        api.get(test, '/user', function(res) {
            //JSON responses are automatically parsed:
            test.equal(res.json, [{ name: 'Eric' }, { 'name': 'Kyle' }]);

            test.done();
        });
    };
    
    //POST with data and custom header
    exports.test3 = function(test) {
        api.post(test, '/user', {
            headers: { foo: 'bar' },
            data: { name: 'Charlie' } //Objects are serialised as JSON automatically
        }, {
            status: 200
        }, function(res) {
            test.equal(1, 1);
            
            test.done();
        });
    };
    

Changelog
---------

0.2.0
- Handle 204 No Content responses
