var tessel;
var config = require('./_config.js');
var http = require('http');
var querystring = require('querystring');
var wifi = require('wifi-cc3000');
var busy = false;
wifi.on('connect', function(){
    console.log('connect done');
    busy = false;
});
//{{ ajax functions
var ajax = function(opts){
    opts = opts || {};
    if(busy) {
        console.log('wifi is busy, stop ajax');
        if(opts.success) opts.success('error');
        return;
    }
    var options = {
        hostname: opts.host || config.ajax.host,
        port: opts.port || config.ajax.port,
        path: opts.path,
        method: opts.type=='post'?'POST':'GET'
    };
    var data = querystring.stringify(opts.data || '');
    if(opts.type == 'post'){
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        };
    } else {
        options.method = 'GET';
        options.path += (options.path.indexOf('?')==-1?'?':'&') + data
    }
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', opts.success || function (chunk) {});
    });
    req.on('error', function(e) {
        switch(e.message){
        case "data received after completed connection: close message":
            break;
        default:
            console.log('wifi error?');
            busy = true;
            wifi.reset(function(){
                console.log('reset done')
                wifi.connect({ ssid: config.wifi.ssid, password: config.wifi.password});
            });
            break;
        }
        console.log('problem with request: ' + e.message);
    });
    if(opts.type=='post') {
        req.write(data);
    }
    req.end();
    return req;
};
////}}

var testing = function(){
    tessel = require('tessel');
    console.log(
        'ajax.js Test Interface***\r\n'+
        'Press tessel config button...'
    );
    tessel.button.on('press', function(time) {
        console.log('the button was pressed!');
        var rsp = ajax({
            host: 'grassboy.tw',
            path: '/tmp/echo.php',
            success: function(r){
                console.log('yeah!!!' + r);
            }
        });
    });
};
if(module.parent && module.parent.parent) { //is required file
    module.exports = ajax;
    module.exports.testing = testing;
} else {
    console.log('ajax.js Local File Testing');
    testing();
}
