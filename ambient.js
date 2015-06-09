var tessel = require('tessel');
var ambient;
var ambientlib = require('ambient-attx4');
var MAX_THRESHOLD = 0.99;
var sound_handlers = [];
var light_handlers = [];
var light_below_handlers = [/*
    {count: 30, now:0, handler:[function],threshold}
*/];
var sound_cd_time = 100;
var light_cd_time = 100;
var sound_threshold = 0.04;
var light_threshold = 0.22;
var sound_logs = [],light_logs = [];
var LOG_SIZE = 3;



var use = function(from_port, ready_callback, error_callback) {
    ready_callback = ready_callback || function(){ };
    error_callback = error_callback || function(err){ console.log(err);}
    ambient = ambientlib.use(tessel.port[from_port]);
    ambient.on('ready', function(){
        setLightSoundInterval(function(light, sound){
            if(!light.ok || !sound.ok) {
                if(!light.ok) console.log("ERROR Light: "+light.error);
                if(!sound.ok) console.log("ERROR Sound: "+sound.error);
            } else {
                light_logs.push(light.value);
                sound_logs.push(sound.value);
                if(light_logs.length > 3) light_logs.splice(0, 1);
                if(sound_logs.length > 3) sound_logs.splice(0, 1);
                if(light_below_handlers.length == 0) {
                    return;
                } else {
                    for(var i = 0; i < light_below_handlers.length; ++i){
                        var now_handler = light_below_handlers[i];
                        if(light.value <= now_handler.threshold) {
                            now_handler.now++;
                            if(now_handler.now == now_handler.count) {
                                console.log('Light Below Listener has been add...');
                                now_handler.handler();
                                light_below_handlers.splice(i, 1);
                            }
                        } else {
                            now_handler.now = 0;
                        }
                    }
                }
            }
        }, 5000);
        ready_callback();
    });
    ambient.on('error', error_callback);
    ambient.on('light-trigger', function(data) {
        if(light_handlers.length <= 0) return;
        console.log("Our light trigger was hit:", data);
        ambient.clearLightTrigger();
        for(var i = 0, n = light_handlers.length; i < n; ++i){
            (light_handlers[i])();
        }
        setTimeout(function () {
            ambient.setLightTrigger(light_threshold);
        }, light_cd_time);
    });
    ambient.on('sound-trigger', function(data) {
        if(sound_handlers.length <= 0) return;
        console.log("Something happened with sound: ", data);
        ambient.clearSoundTrigger();
        for(var i = 0, n = sound_handlers.length; i < n; ++i){
            (sound_handlers[i])();
        }
        setTimeout(function() {
            ambient.setSoundTrigger(sound_threshold);
        }, sound_cd_time);
    });

    return ambient;
};

var setLightTrigger = function(threshold, cd_time) {
    light_threshold = threshold;
    ambient.setLightTrigger(threshold);
    light_cd_time = cd_time;
};
var setSoundTrigger = function(threshold, cd_time) {
    sound_threshold = threshold;
    ambient.setSoundTrigger(threshold);
    sound_cd_time = cd_time;
};
var addLightListener = function(callback){
    light_handlers.push(callback);
};
var addSoundListener = function(callback){
    sound_handlers.push(callback);
};
var removeLightListener = function(callback){
    if(!callback) {
        light_handlers = [];
    } else {
        for(var i = 0, n = light_handlers.length; i < n; ++i){
            if(light_handlers[i] == callback) {
                light_handlers.splice(i, 1);
                return;
            }
        }
    }
};
var removeSoundListener = function(callback){
    if(!callback) {
        sound_handlers = [];
    } else {
        for(var i = 0, n = sound_handlers.length; i < n; ++i){
            if(sound_handlers[i] == callback) {
                sound_handlers.splice(i, 1);
                return;
            }
        }
    }
};

var setLightSoundInterval = function(callback, interval) {
    return setInterval(function main(){
        ambient.getLightLevel(function(err, ldata) {
            if (err) {
                lresult = {ok: false, error: err};
            } else {
                lresult = {ok: true, value: ldata};
            }
            ambient.getSoundLevel(function(err, sdata) {
                if (err) {
                    sresult = {ok: false, error: err};
                } else {
                    sresult = {ok: true, value: sdata};
                }
                callback(lresult, sresult);
                //console.log("Light level:", ldata.toFixed(8), " ", "Sound Level:", sdata.toFixed(8));
            });
        });
    }, interval);
};

//arguments: handler_all, on_sound1, on_sound2, on_sound3 ...
var setLightSoundListener = function() {
    var _light_handler, _sound_handler, current_index = 0, reset_timer;
    var args = arguments;
    if(args.length < 2) {
        throw "You need at least one light-trigger and one sound-trigger";
    } else {
        var global_handler = args[0];
        var _waitNextSignal = function(default_timeout){
            current_index++;
            var timeout = (args[current_index])() || default_timeout;
            clearTimeout(reset_timer);
            reset_timer = setTimeout(function(){
                global_handler(current_index);
                current_index = 0;
            }, timeout);
        };
        _light_handler = function(){
            if(current_index != 0){
                return;
            } else {
                _waitNextSignal(10000);
            }
        };
        _sound_handler = function(){
            if(current_index == 0){
                return;
            } else if(current_index == args.length - 1) {
                clearTimeout(reset_timer);
                global_handler(current_index+1);
                current_index = 0;
            } else {
                _waitNextSignal(3000);
            }
        };
        addLightListener(_light_handler);
        addSoundListener(_sound_handler);
        return [_light_handler, _sound_handler];
    }
};
var clearLightSoundListener = function(listeners){
    removeLightListener(listeners[0]);
    removeSoundListener(listeners[1]);
};

var setLightBelowListener = function(threshold, count, callback){
    var result = {
        threshold: threshold,
        count: count,
        now: 0,
        handler: callback
    };
    light_below_handlers.push(result);
    return result;
};
var clearLightBelowListener = function(listener) {
    for(var i = 0, n = light_below_handlers.length; i < n; ++i){
        if(light_below_handlers[i] == listener) {
            light_below_handlers.splice(i, 1);
            return;
        }
    }
};


var testing = function() {
    var LED = require('./led.js');
    use('C', function(){
        console.log(
            'ambient.js Test Interface***\r\n'+
            'Press tessel config button...'
        );
        setLightTrigger(0.3, 200);
        setSoundTrigger(0.13, 200);
        setLightSoundListener(function(now_step){
            console.log('listener result: ', now_step);
            switch(now_step){
            case 1: //only light triggered
                LED.display([
                    0x1111, 500,
                    0x0000, 500,
                    0x1111, 500,
                    0x0000, 500,
                    0x1111, 500,
                    0x0000, 500,
                    0x1111
                ]);
                return 10000;
                break;
            case 2: //light trigger with one sound
                LED.display([
                    0x1000, 500,
                    0x0000, 500,
                    0x1000, 500,
                    0x0000, 500,
                    0x1000, 500,
                    0x0000, 500,
                    0x1000
                ]);
                break;
            case 3: //with two sound
                LED.display([
                    0x0100, 500,
                    0x0000, 500,
                    0x0100, 500,
                    0x0000, 500,
                    0x0100, 500,
                    0x0000, 500,
                    0x0100
                ]);
                break;
            case 4: //with three sound
                LED.display([
                    0x0010, 500,
                    0x0000, 500,
                    0x0010, 500,
                    0x0000, 500,
                    0x0010, 500,
                    0x0000, 500,
                    0x0010
                ]);
                break;
            case 5: //with four sound
                LED.display([
                    0x0001, 500,
                    0x0000, 500,
                    0x0001, 500,
                    0x0000, 500,
                    0x0001, 500,
                    0x0000, 500,
                    0x0001
                ]);
                break;
            case 6: //with five sound
                LED.display(LED.ProjectStart);
                break;
            }
        }, function(){
            console.log('light triggered, wait for sound');
            LED.display([0x1111]);
        }, function(){
            console.log('got sound1');
            LED.display([0x1000]);
        }, function(){
            console.log('got sound2');
            LED.display([0x0100]);
        }, function(){
            console.log('got sound3');
            LED.display([0x0010]);
        }, function(){
            console.log('got sound4');
            LED.display([0x0001]);
        });
        tessel.button.on('press', function(time) {
            console.log('I will monitor the light/sound for 10 seconds...');
            var interval = setLightSoundInterval(function(light, sound){
                if(!light.ok || !sound.ok) {
                    if(!light.ok) console.log("ERROR Light: "+light.error);
                    if(!sound.ok) console.log("ERROR Sound: "+sound.error);
                } else {
                    console.log("light level: ", light.value, "sound level: ", sound.value);
                }
            }, 500);
            setTimeout(function(){
                clearInterval(interval);
            }, 10000);
        });
    });
};

if(module.parent && module.parent.parent) { //is required file
    module.exports.use = use;
    module.exports.setLightTrigger = setLightTrigger;
    module.exports.setSoundTrigger = setSoundTrigger;
    module.exports.addLightListener = addLightListener;
    module.exports.addSoundListener = addSoundListener;
    module.exports.removeLightListener = removeLightListener;
    module.exports.removeSoundListener = removeSoundListener;
    module.exports.setLightSoundInterval = setLightSoundInterval;
    module.exports.setLightSoundListener = setLightSoundListener;
    module.exports.setLightBelowListener = setLightBelowListener;
    module.exports.clearLightSoundListener = clearLightSoundListener;
    module.exports.light_logs = light_logs;
    module.exports.sound_logs = sound_logs;
    module.exports.testing = testing;
} else {
    console.log('ambient.js Local File Testing');
    testing();
}
