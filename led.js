/*
 * led.js
 * make your tessel display led as your wish
 * */
var tessel = require('tessel');
//{{ LED functions
//{{ //LED sequence ROYB
//TODO: these LED sequence data sould not be included in this file...
LED = {
    Mute: 0x0000,
    Press: 0x1010,
    Press2: 0x0101,
    StartRecord: [
        0x0000, 100,
        0x0001, 100,
        0x0000, 100,
        0x0001, 100,
        0x0000, 100,
        0x0001, 100,
        0x0000, 100
    ],
    ProjectStart: [
        0x0001, 100,
        0x0011, 100,
        0x0111, 100,
        0x1111, 100,
        0x1110, 100,
        0x1100, 100,
        0x1000, 100,
        0x0000, 100
    ],
    Reverse: [
        0x0000, 1000,
        0x0001, 1000,
        0x0011, 1000,
        0x0010, 1000,
        0x0110, 1000,
        0x0111, 1000,
        0x0101, 1000,
        0x0100, 1000,
        0x1100, 1000,
        0x1101, 1000,
        0x1111, 1000,
        0x1110, 1000,
        0x1010, 1000,
        0x1011, 1000,
        0x1001, 1000,
        0x1000, 1000
    ]
};
////}}
//{{ ShowLED: LED Displayer
var ShowLED = function(LEDsequence, index){
    index = index || 0;
    if(typeof LEDsequence == 'number') {
        tessel.led[2].write((LEDsequence & 0x1000)>0); //red
        tessel.led[3].write((LEDsequence & 0x0100)>0); //orange (wifi)
        tessel.led[0].write((LEDsequence & 0x0010)>0); //yellow
        tessel.led[1].write((LEDsequence & 0x0001)>0); //blue
    } else {
        if(index > LEDsequence.length) {
            tessel.led[0].write(0);
            tessel.led[1].write(0);
            tessel.led[2].write(0);
            tessel.led[3].write(0);
            return;
        };
        tessel.led[2].write((LEDsequence[index] & 0x1000)>0); //red
        tessel.led[3].write((LEDsequence[index] & 0x0100)>0); //orange (wifi)
        tessel.led[0].write((LEDsequence[index] & 0x0010)>0); //yellow
        tessel.led[1].write((LEDsequence[index] & 0x0001)>0); //blue
        if(index+1 < LEDsequence.length){
            setTimeout(function(){
                ShowLED(LEDsequence, index+2);
            }, LEDsequence[index+1]);
        }
    }
};
////}}
////}}

var testing = function(){
    console.log(
        'led.js Test Interface***\r\n'+
        'Press tessel config button...'
    );
    ShowLED(LED.Mute);
    tessel.button.on('press', function(time) {
        ShowLED(LED.ProjectStart);
        console.log('the button was pressed!');
    });
};
if(module.parent && module.parent.parent) { //is required file
    module.exports = LED;
    module.exports.display = ShowLED;
    module.exports.testing = testing;
} else {
    console.log('led.js Local File Testing');
    testing();
}
