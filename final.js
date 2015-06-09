/*
 LIGHT UP suddenly:
    within 10 seconds:
        snapping finger * 3 ==> open project monitor, open theater
        //(Cannot implement due to tessel's bug?) snapping finger * 4 ==> open project monitor, open theater, and open air conditioner 
 LIGHT OFF:
    after 20 period (100 seconds):
        add listener for light up
 IR input
    Btn1:
        heart beat checking
    Btn2: 
        press 1st time: light on, and light off after 30 minutes
        press 2nd time: light off
    Btn3:
        press 1st time: power off project/theater after 30 minutes
        press 2nd time: power off project/theater after 60 minutes
        press 3rd time: power off project/theater after 90 minutes
        press 4th time: power off project/theater after 120 minutes
        press 5th time: cancel power off project/theater timer
    Btn4:
        record a sequence of ir signal until Btn3 is pressed again
    Btn5:
        replay the sequence of ir signal that recorded by Btn3
    Btn6:
        press 1st time: do the Btn4 does after 30 minutes
        press 2nd time: do the Btn4 does after 60 minutes
        press 3rd time: do the Btn4 does after 90 minutes
        press 4th time: do the Btn4 does after 120 minutes
        press 5th time: cancel the replay timer
 * */

var tessel = require('tessel');
var config = require('./_config.js');
var IR = require('./ir.js');
var ambient = require('./ambient.js');
var LED = require('./led.js');
var buzzer = require('./buzzer.js');
var buzzer_notes = [
    "g .1 g",
    "c",
    "c d",
    "c d e",
    "c d e f",
];
var Console = require('./web_console.js');
var ambient_lib, IR_lib;

var light_below_listener, light_sound_listener;
var combo_sequence = [ //default combo sequence
    'PROJECT_POWER', 1000,
    'PROJECT_POWER', 1000,
    'THEATER_POWER', 1000
];

var main = function(){
    var LIGHT_ON = 0.015, LIGHT_OFF = 0.012;
    var FLIP_SOUND = 0.13;
    ambient.setLightTrigger(LIGHT_ON, 1000);
    ambient.setSoundTrigger(FLIP_SOUND, 100);
    IR.addKEY('PROJECT_POWER', [34,246,238,208,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,88,254,12,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,88,249,192,2,88,254,12,2,88,254,12,2,88,249,142,2,88,254,12,2,88,254,12,2,88,254,12,2,88,249,142,2,38,249,142,2,88,249,192,2,88,254,12,2,88,253,218,2,88,254,12,2,88,254,12,2,88,249,192,2,88,253,218,2,38,253,218,2,88,254,12,2,88,249,192,2,88,249,142,2,38,249,142,2,88,249,192,2,88,253,218,2,38]);
    IR.addKEY('THEATER_POWER', [10,90,252,124,1,244,252,224,1,194,254,62,1,194,254,112,1,194,252,124,3,132,254,112,3,182,252,174,1,244,254,162,1,194,254,62,3,132,254,112,1,194,252,124,3,132,254,112,1,194,252,124,1,194,254,112,1,194,254,62,3,132,254,112,1,194,254,62,1,194]);
    IR.addKEY_in('Btn1', [0, 179, -88, 12, -33, 11, -33, 12, -11, 11, -11, 11, -33, 12, -33, 11, -33, 11, -12, 11, -33, 11, -11, 11, -12, 11, -33, 11, -11, 11, -33, 12, -11, 11, -11, 11, -11, 11, -33, 12, -33, 11, -33, 11, -12, 11, -11, 11, -11, 11, -12, 10, -34, 11, -11, 11, -11, 11, -12, 10, -34, 11, -33, 11, -34, 11, -33, 11 ]);
    IR.addKEY_in('Btn2', [0, 179, -89, 11, -33, 11, -33, 12, -11, 11, -11, 11, -33, 12, -33, 11, -33, 11, -11, 12, -33, 11, -11, 11, -11, 12, -33, 11, -11, 11, -33, 12, -10, 12, -11, 11,-33, 11, -34, 11, -33, 11, -33, 12, -11, 11, -11, 11, -11, 11, -11, 12, -10, 12, -11, 11, -11, 11, -11, 11, -34, 11, -33, 11, -33, 12, -33, 11 ]);
    IR.addKEY_in('Btn3', [0, 180, -88, 12, -33, 11, -33, 11, -12, 11, -11, 11, -33, 11, -33, 12, -33, 11, -12, 11, -33, 11, -11, 11, -12, 10, -34, 11, -11, 11, -33, 12, -11, 11, -11, 11,-11, 11, -12, 10, -34, 11, -33, 11, -12, 11, -11, 11, -11, 11, -11, 11, -33, 12, -33, 11, -12, 10, -11, 12, -33, 11, -33, 12, -33, 11, -33, 12 ]);
    IR.addKEY_in('Btn4', [0, 179, -89, 11, -33, 12, -33, 11, -11, 11, -11, 12, -33, 11, -33, 11, -33, 12, -11, 11, -33, 11, -11, 12, -11, 11, -33, 11, -11, 11, -34, 11, -11, 11, -11, 11,-11, 12, -33, 11, -11, 11, -11, 11, -34, 11, -11, 11, -11, 11, -11, 11, -34, 11, -11, 11, -33, 12, -33, 11, -11, 11, -33, 12, -33, 11, -33, 12 ]);
    IR.addKEY_in('Btn5', [0, 179, -88, 12, -33, 11, -33, 12, -11, 11, -11, 11, -33, 11, -34, 11, -33, 11, -11, 12, -33, 11, -11, 11, -11, 11, -34, 11, -11, 11, -33, 12, -10, 12, -11, 11,-33, 12, -33, 11, -11, 11, -11, 11, -33, 12, -11, 11, -11, 11, -11, 11, -11, 12, -11, 11, -33, 11, -33, 12, -11, 11, -33, 11, -34, 11, -33, 11 ]);
    IR.addKEY_in('Btn6', [0, 179, -89, 12, -32, 12, -33, 11, -11, 11, -11, 11, -34, 11, -33, 11, -34, 11, -11, 11, -33, 11, -11, 12, -11, 11, -33, 11, -11, 12, -33, 11, -11, 11, -11, 12,-10, 12, -11, 11, -11, 11, -11, 11, -34, 11, -11, 11, -11, 11, -11, 12, -33, 11, -33, 11, -34, 11, -33, 11, -11, 11, -34, 11, -33, 11, -34, 11 ]);
    IR.setDefaultHandler(function(data, data_minify){
        console.log('Unknown Data output: ');
        console.log(data);
        console.log('Unknown Data input: ');
        console.log(data_minify);
    });

    IR.addKEY_handler('Btn1', function(){
        LED.display([
            0x1000,100,
            0x0100,100,
            0x0010,100,
            0x0001,100,
            0x0011,100,
            0x0111,100,
            0x1111,100,
            0x1110,100,
            0x1100,100,
            0x1000,100,
            0x0000
        ]);
    });
    IR.addKEY_handler('Btn2', (function(){
        var timer, state = 0, period = 1800000;
        var relay_pin = tessel.port['B'].pin['G3']; // select the B port
        relay_pin.output();
        return function(){
            state = (state+1) % 2;
            clearTimeout(timer);
            switch(state) {
            case 0:
                buzzer.play(buzzer_notes[state]);
                relay_pin.write(false);
                break;
            case 1:
                buzzer.play(buzzer_notes[state]);
                relay_pin.write(true);
                timer = setTimeout(function(){
                    relay_pin.write(false);
                }, period*state);
                break;
            }
        };
    })());
    IR.addKEY_handler('Btn3', (function(){
        var timer, state = 0, period = 1800000;
        return function(){
            state = (state+1) % 5;
            clearTimeout(timer);
            switch(state) {
            case 0:
                buzzer.play(buzzer_notes[state]);
                break;
            case 1: case 2: case 3: case 4:
                buzzer.play(buzzer_notes[state]);
                timer = setTimeout(function(){
                    IR.SendIR([
                        'PROJECT_POWER', 1000,
                        'PROJECT_POWER', 1000,
                        'THEATER_POWER', 1000
                    ]);
                }, period*state);
                break;
            }
        };
    })());
    IR.addKEY_handler('Btn4', function(){
        console.log("Start Recoding...");
        LED.display(LED.StartRecord);
        IR.addIgnoreButHandler('Btn4', function(sequence){
            LED.display([
                0x1000,100,
                0x0000,100,
                0x1000,100,
                0x0000,100,
                0x1000,100,
                0x0000,100
            ]);
            console.log(sequence.length / 2, 'KEYs recorded');
        }, function(sequence){
            LED.display(LED.StartRecord);
            console.log('Done!!', sequence.length / 2, 'KEYs recorded');
            combo_sequence = sequence;
        });
    });
    IR.addKEY_handler('Btn5', function(){
        if(!combo_sequence) {
            buzzer.play('C8 .4 C8 .4 C8');
            return;
        }
        IR.SendIR(combo_sequence);
    });
    IR.addKEY_handler('Btn6', (function(){
        var timer, state = 0, period = 1800000;
        return function(){
            if(!combo_sequence) {
                buzzer.play('C8 .4 C8 .4 C8');
                return;
            }
            state = (state+1) % 5;
            clearTimeout(timer);
            switch(state) {
            case 0:
                buzzer.play(buzzer_notes[state]);
                break;
            case 1: case 2: case 3: case 4:
                buzzer.play(buzzer_notes[state]);
                timer = setTimeout(function(){
                    IR.SendIR(combo_sequence);
                }, period*state);
                break;
            }
        };
    })());

    light_below_listener = ambient.setLightBelowListener(LIGHT_OFF, 5, function lightBelowCallback(){
        light_sound_listener = ambient.setLightSoundListener(function lightSoundCallback(now_step){
            ambient.clearLightSoundListener(light_sound_listener);
            light_below_listener = ambient.setLightBelowListener(LIGHT_OFF, 5, lightBelowCallback);
            switch(now_step){
            case 1: //only light triggered
                LED.display([
                    0x1111, 500,
                    0x0000, 500,
                    0x1111, 500,
                    0x0000, 500,
                    0x1111, 500,
                    0x0000, 500,
                    0x1111, 500
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
                    0x1000, 500
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
                    0x0100, 500
                ]);
                break;
            case 4: //with three sound
                LED.display([
                    0x0010, 100,
                    0x0100, 100,
                    0x1000, 100,
                    0x0100, 100,
                    0x0010, 100,
                    0x0100, 100,
                    0x1000, 100,
                    0x0100, 100,
                    0x0010, 100,
                    0x0100, 100,
                    0x1000, 100
                ]);
                IR.SendIR([
                    'PROJECT_POWER', 1000,
                    'THEATER_POWER', 1000
                ]);
                break;
            case 5: //with four sound
                LED.display(LED.ProjectStart);
                IR.SendIR([
                    'PROJECT_POWER', 1000,
                    'THEATER_POWER', 1000
                ]);
                break;
            }
        }, function(){
            if(ambient.light_logs[0] > (LIGHT_ON + LIGHT_OFF)/2) { //is it really work??
                console.log('Not suddenly... skip...');
                return 0;
            } else {
                LED.display([0x1111]);
                return 10000;
            }
        }, function(){
            console.log('got sound1');
            LED.display([0x0100]);
        }, function(){
            console.log('got sound2');
            LED.display([0x0010]);
        }, function(){
            console.log('got sound3');
            LED.display([0x0001]);
        });
    });
    setInterval(function(){
        IR.resetDataListener();
        console.log('IR Listener reset');
    }, 300000);

    tessel.button.on('press', function(time) {
        IR.resetDataListener();
        console.log('IR Listener reset');
    });
};

buzzer.use(0);
ambient_lib = ambient.use('C', function(){
    IR_lib = IR.use('D', main);
});
