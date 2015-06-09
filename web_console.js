/*
Tessel ajax & web console
make your tessel log into a remote file
 * */
var tessel;
var config = require('./_config.js');
var ajax = require('./ajax.js');
var Base64 = require('./base64.js').Base64;
//{{ Tessel Web Console
var Console = {
    log: function(msg, callback){
        if(config.is_debug) console.log(msg);
        var args = {
                host: config.Console.host,
                path: config.Console.log_path,
                data: {}
            };
        if(typeof msg == 'object') {
            args.data.type = 'json';
            args.data.msg = JSON.stringify(msg);
        } else {
            args.data.msg = msg;
        }
        if(typeof callback == 'function') {
            args.success = callback;
        } else {
            args.data._silent = 'yes';
        }
        return ajax(args);
    },
    message: function(msg, callback){
        var args = {
            host: config.Console.host,
            path: config.Console.msg_path,
            data: {
                encode: 'utf-8',
                msg: Base64.toBase64(msg)
            }
        };
        if(typeof callback == 'function') {
            args.success = callback;
        } else {
            args.data._silent = 'yes';
        }
        return ajax(args);
    }
};
////}}
var testing = function(){
    tessel = require('tessel');
    console.log(
        'Console.js Test Interface***\r\n'+
        'Press tessel config button...'
    );
    setInterval(function(){
        Console.log((new Date()).toString()+' Ping');
    }, 10000);
    tessel.button.on('press', function(time) {
        (function manyLog(i){
            Console.log('Now i = '+i, function(){
                if(i > 0) manyLog(i-1);
            });
        })(4);
        Console.message('我是一個小胖子', function(r){console.log(r)});
        Console.message('你是一個小胖子');
        console.log('the button was pressed!');
    });
};
if(module.parent && module.parent.parent) { //is required file
    module.exports = Console;
    module.exports.testing = testing;
} else {
    console.log('Console.js Local File Testing');
    testing();
}
