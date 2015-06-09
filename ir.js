var tessel = require('tessel');
var infrared;
var infraredlib = require('ir-attx4');

var KEY = {}
var KEY_PREV_COMBO = [];
var KEY_in = {};
var KEY_handler = {};
var default_handler = null;
var ignore_input_but = null;
var ignore_input_handler = null;
var ignore_input_done_handler = null;

var use = function(from_port, ready_callback, error_callback) {
    ready_callback = ready_callback || function(){ };
    error_callback = error_callback || function(err){ console.log(err);}
    infrared = infraredlib.use(tessel.port[from_port]);
    infrared.on('ready', function(){
        dataListener && infrared.removeListener('data', dataListener);
        dataListener && infrared.on('data', dataListener);
        ready_callback();
    });
    infrared.on('error', error_callback);
    return infrared;
};

var minifyData = function(input){ //minify the IR Data
    var result = [], t;
    for(var i = 0; i < input.length; i+=2){
        t = (input[i]*0x100+input[i+1]);
        result[result.length] = (t>32767?(-((t^65535)+1)):t)/50;
    }
    return result;
};
var toInt8Array = function(input){
    var result = [];
    for(var i = 0; i < input.length; i++){
        result[result.length] = (input[i] & 0xff);
    }
    return result;
};
var minifyData2 = function(input) {
    var result = [];
    for(var i = 0; i < input.length; i+=2){
        result[result.length] = input.readInt16BE(i);
    }
    return result;
};
var _SendIRRaw = function(key, callback){
    // Send the signal at 38 kHz
    infrared.sendRawSignal(38, key, function(err) {
        if (err) {
            console.log("Unable to send signal: ", err);
            callback(true);
        } else {
            callback(false);
        }
    });
};
var SendIR = function(IRsequence, callback) {
    callback = callback || function() {};
    var main = function(index){
        index = index || 0;
        dataListener && infrared.removeListener('data', dataListener);
        if(typeof IRsequence == 'string') {
            _SendIRRaw(KEY[IRsequence], function(has_error){
                console.log("Signal sent!");
                dataListener && infrared.on('data', dataListener);
                callback(has_error);
            });
        } else {
            if(index >= IRsequence.length) {
                console.log("Signal sent!");
                dataListener && infrared.on('data', dataListener);
                callback(has_error);
            } else {
                var now_key = IRsequence[index];
                console.log('now send key: ' + now_key);
                _SendIRRaw((typeof now_key == 'string')?KEY[IRsequence[index]]:IRsequence[index], function(has_error){
                    console.log('next send key: ', IRsequence[index+2], ' after ', IRsequence[index+1], 'ms');
                    setTimeout(function(){
                        main(index+2);
                    }, IRsequence[index+1]);
                });
            }
        }
    };
    main(index);
};

var addKEY = function(name, data) {
    KEY[name] = new Buffer(data);
};
var removeKEY = function(name) {
    KEY[name] = null;
    delete KEY[name];
    removeKEYhandler(name);
}

var addKEY_in = function(name, data) {
    if(data[0]!=0) {
        console.log("addKEY_in Warning: data[0] must be zero for IR Siginal Comparing!!!");
    }
    KEY_in[name] = data;
};
var addKEY_handler = function(name, handler) {
    if(KEY_in[name]) {
        KEY_handler[name] = KEY_handler[name] || [];
        KEY_handler[name].push(handler);
    } else {
        console.log("ERROR: KEY_in of handler is not exists!!!");
    }
};
var removeKEY_in = function(name) {
    KEY_in[name] = null;
    delete KEY_in[name];
};
var removeKEY_handler = function(name, handler) {
    if(KEY_handler[name]) {
        for(var i = 0; i < KEY_handler[name].length; ++i){
            if(!handler || KEY_handler[name][i] == handler) {
                KEY_handler[name].splice(i, 1);
            }
        }
    }
};

var addIgnoreButHandler = function(name, ignore_handler, done_handler) {
    if(KEY_in[name]) { //key exists
        ignore_input_but = name;
        ignore_input_handler = ignore_handler;
        ignore_input_done_handler = done_handler;
        KEY_PREV_COMBO = [];
    } else {
        console.log("ERROR: Ignore KEY_in is not exists!!!");
    }
};
var setDefaultHandler = function(handler) {
    default_handler = handler;
};

var dataListener = function(data) {
    console.log('IR siginal in');
    var i = 0, may_match = true, diff = 5, n, t, key, signal;
    while(may_match) {
        if(i > 0){
            t = data[2*(i-1)]*0x100+data[2*(i-1)+1];
            t = (t>32767?(-((t^65535)+1)):t)/50;
            may_match = false;
        }
        for(key in KEY_in){
            signal = KEY_in[key];
            if(i == 0){ //init
                signal[0] = 1;
            } else if(signal[0] == 1 && ((i-1)*2 < data.length)) { //may match && i >= 1;
                if(t - signal[i] < diff && t - signal[i] > -diff) {
                    may_match = true;
                } else {
                    //console.log("not match key: ", key, " at i = ", i, "( t: ", t, ", signal: ", signal[i], ")");
                    signal[0] = 0;
                }
            } else if ((i-1)*2 > data.length) { // input data length > current data length
                //console.log("not match key: ", key, " at i = ", i, "( t: ", t, ", signal: ", signal[i], ")");
                signal[0] = 0;
            }
        }
        i++;
    }
    if(!ignore_input_but) {
        var has_match = false;
        for(key in KEY_in) {
            if(KEY_in[key][0] == 1) { //match
                has_match = true;
                for(i = 0, n = KEY_handler[key].length; i < n; ++i){
                    (KEY_handler[key][i])();
                }
            }
        }
        if(!has_match && default_handler) {
            console.log('BuiltIn Input: ');
            console.log((new Date()).getTime());
            console.log(minifyData2(data));
            console.log((new Date()).getTime());
            console.log(minifyData(data));
            console.log((new Date()).getTime());
            console.log(toInt8Array(data));
            console.log((new Date()).getTime());

            default_handler(toInt8Array(data), minifyData(data));
        }
    } else if (KEY_in[ignore_input_but][0] == 1) {
        ignore_input_done_handler(KEY_PREV_COMBO);
        ignore_input_handler = ignore_input_done_handler = ignore_input_but = null;
    } else {
        KEY_PREV_COMBO.push(new Buffer(toInt8Array(data)), 10);
        ignore_input_handler(KEY_PREV_COMBO);
    }
};
var resetDataListener = function(){
    infrared.removeListener('data', dataListener);
    infrared.on('data', dataListener);
};

var testing = function(){
    var LED = require('./led.js');
    use('D', function(){
        addKEY('PLAYER_MUTE', [ 13,122,249,42,1,194,254,112,1,194,250,236,1,194,254,112,1,194,254,62,1,144,254,62,1,194,254,112,1,194,254,62,1,144,254,62,1,194,254,112,1,194,254,112,1,194,254,62,1,194,254,112,1,194,254,112,1,194,250,236,1,194,254,112,1,194,254,62,1,194,254,112,1,194,254,112,1,194,254,62,1,194,254,112,1,194,254,112,1,194,250,236,1,194,254,112,1,194,250,236,1,194,254,112,1,194,254,62,1,194,254,112,1,194,254,112,1,194,254,62,1,194,254,112,1,194,254,112,1,194,254,62,1,194,254,112,1,194,250,236,1,194,254,112,1,194,254,112,1,194,250,236,1,194,250,236,1,194,254,112,1,194,254,112,1,194,254,62,1,194,251,30,1,194,254,62,1,194,254,112,1,194,250,236,1,194,254,112,1,194,254,112,1,194,250,236,1,194 ]);
        addKEY('PROJECT_POWER', [34,246,238,208,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,88,254,12,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,88,249,192,2,88,254,12,2,88,254,12,2,88,249,142,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,38,249,142,2,88,249,192,2,88,254,12,2,88,253,218,2,88,254,12,2,88,254,12,2,88,249,192,2,88,253,218,2,38,253,218,2,88,254,12,2,88,249,192,2,88,249,142,2,38,249,142,2,88,249,192,2,88,253,218,2,38]);
        addKEY('THEATER_POWER', [10,90,252,124,1,244,252,224,1,194,254,62,1,194,254,112,1,194,252,124,3,132,254,112,3,182,252,174,1,244,254,162,1,194,254,62,3,132,254,112,1,194,252,124,3,132,254,112,1,194,252,124,1,194,254,112,1,194,254,62,3,132,254,112,1,194,254,62,1,194]);
        addKEY_in('RECORD', [0, 178,-88,11,-32,11,-32,11,-10,11,-10,11,-32,11,-32,11,-32,11,-10,11,-32,11,-10,11,-10,11,-32,11,-10,11,-32,11,-10,11,-10,11,-32,11,-32,11,-10,11,-32,11,-10,11,-10,11,-10,11,-10,11,-10,11,-10,11,-32,11,-10,11,-32,11,-32,11,-32,11,-32,11]);
        addKEY_handler('RECORD', function(){
            console.log("Start Recoding...");
            LED.display(LED.StartRecord);
            addIgnoreButHandler('RECORD', function(sequence){
                console.log(sequence.length / 2, 'KEYs recorded');
            }, function(sequence){
                console.log('Done!!', sequence.length / 2, 'KEYs recorded');
                SendIR("PLAYER_MUTE");
            });
        });
        setDefaultHandler(function(data, data_minify){
            console.log('Unknown Data output: ');
            console.log(data);
            console.log('Unknown Data input: ');
            console.log(data_minify);
        });
        console.log(
            'ir.js Test Interface***\r\n'+
            'Press tessel config button...'
        );
        tessel.button.on('press', function(time) {
            SendIR([
                'PROJECT_POWER', 1000,
                'THEATER_POWER', 1000
            ]);
            return;
            console.log('rebind ir event');
            infrared.removeListener('data', dataListener);
            infrared.on('data', dataListener);
            console.log('rebind ir event done');
        });
    });
};

if(module.parent && module.parent.parent) { //is required file
    module.exports.use = use;
    module.exports.SendIR = SendIR;
    module.exports.addKEY = addKEY;
    module.exports.addKEY_in = addKEY_in;
    module.exports.addKEY_handler = addKEY_handler;
    module.exports.removeKEY = removeKEY;
    module.exports.removeKEY_in = removeKEY_in;
    module.exports.removeKEY_handler = removeKEY_handler;
    module.exports.addIgnoreButHandler = addIgnoreButHandler;
    module.exports.setDefaultHandler = setDefaultHandler;
    module.exports.resetDataListener = resetDataListener;
    module.exports.testing = testing;
} else {
    console.log('ir.js Local File Testing');
    testing();
}
