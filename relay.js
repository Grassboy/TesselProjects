var tessel = require('tessel'); // import tessel
var gpio = tessel.port['GPIO']; // select the GPIO port
var relay_pin = tessel.port['B'].pin['G3']; // select the B port
var is_on = false;
relay_pin.output();
relay_pin.write(is_on);

//event listening
tessel.button.on('press', function(time) {
    is_on = !is_on;
    relay_pin.write(is_on);
    console.log(is_on?'ON':'OFF');
});

