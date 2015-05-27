var tessel = require('tessel'); // import tessel
var gpio = tessel.port['GPIO']; // select the GPIO port
var portb = tessel.port['B']; // select the B port
var digitalPins = [
    portb.pin['G3'],
    portb.pin['G2'],
    gpio.pin['G3'],
    gpio.pin['G2'],
    gpio.pin['G1'],
    gpio.pin['G6'],
    gpio.pin['G5'],
    gpio.pin['G4']
];
var index = 0;
var digits = [
    0x00000000,
    0x10000000,
    0x01000000,
    0x00100000,
    0x00010000,
    0x00001000,
    0x00000100,
    0x00000010,
    0x00000001,
    0x11111100,
    0x01100000,
    0x11011010,
    0x11110010,
    0x01100110,
    0x10110110,
    0x10111110,
    0x11100100,
    0x11111110,
    0x11110110
];
var drawRaw = function(data){
    for(var i = 0; i < 8; ++i){
        if( ( (1 << ((7-i)*4)) & data ) != 0 ) {
            digitalPins[i].write(0);
        } else {
            if(i != 7) digitalPins[i].write(1);
        }
    }
};

//init
for(var i = 0, n = digitalPins.length; i < n; ++i){
    digitalPins[i].output();
    digitalPins[i].write(0);
}

var blink = false;
setInterval(function(){
    digitalPins[7].write(blink?0:1);
    blink = !blink;
}, 500);

//event listening
tessel.button.on('press', function(time) {
    drawRaw(digits[index]);
    index = (count + 1) % digits.length;
});
