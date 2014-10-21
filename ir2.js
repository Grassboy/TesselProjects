/*********************************************
IR Button test
You can press the buttons of any IR remote control
if the button is the first time pressed, tessel will recognize this button later
if not the first time pressed, tessel will tell you how many times you pressed
*********************************************/
var tessel = require('tessel');
var infraredlib = require('ir-attx4');
var infrared = infraredlib.use(tessel.port['B']);

infrared.on('ready', function(err) {
  if (!err) {
    console.log("Connected to IR!");
  } else {
    console.log(err);
  }
});

var checkSample = (function(){
    var sampleList = [], result;
    var buttons = [];
    return function(input){
        var diff = 5;
        result = [], t, sample;
        for(var i = 0; i < input.length; i+=2){
            t = (input[i]*0x100+input[i+1])^65535
            result[result.length] = (t>32767?(-((t^65535)+1)):t)/50;
        }
        for(var j = 0, n2 = sampleList.length; j < n2; ++j){
            sample = sampleList[j];
            if(result.length != sample.length) continue;
            for(var i = 0, n = result.length; i < n; ++i){
                if(Math.abs(result[i]-sample[i]) > diff){
                    break;
                }
            }
            if(i==result.length) break;
        }
        if(j==sampleList.length){
            buttons[j] = 1;
            sampleList[j] = result;
            console.log('You pressed this button first time, let me call this button as "btn'+j+'"');
        } else {
            buttons[j]++;
            console.log('You\'ve pressed "btn'+j+'" before, this is the '+buttons[j]+' times...');
        }
    };
})();

infrared.on('data', function(data) {
    for(var i = 0, n = data.length; i < n; ++i){
        data[i] = data[i] ^ 0xFF;
    }
    checkSample(data);
});

