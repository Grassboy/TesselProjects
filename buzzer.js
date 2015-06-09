// alter from https://forums.tessel.io/t/8-bit-ish-music-player/453
// more notes mapping from https://github.com/zzkt/fluxus/blob/master/modules/scheme/itchy.ss
var tessel = require('tessel');
var port, pin;

var use = function(pwm_index){
    port = tessel.port['GPIO'];
    pin = port.pwm[pwm_index];
}
var notes = {
    'C'     :1046.5,
    'C#'    :1108.73,
    'D'     :1174.66,
    'D#'    :1244.51,
    'E'     :1318.51,
    'F'     :1396.91,
    'F#'    :1479.98,
    'G'     :1567.98,
    'G#'    :1661.22,
    'A'     :1760,
    'A#'    :1864.66,
    'B'     :1975.53,
    'c'     :2093,
    'c#'    :2217.46,
    'd'     :2349.32,
    'd#'    :2489.02,
    'e'     :2637.02,
    'f'     :2793.83,
    'f#'    :2959.96,
    'g'     :3135.96,
    'g#'    :3322.44,
    'a'     :3520,
    'a#'    :3729.31,
    'b'     :3951.07
};

var play = function(note_list) {
    var frequencies = note_list.split(' ');
    var index = 0;
    var to_beat = function(note) {
        var components = note.match(/([\.\w]\#?)(\d*)/);
        var time = parseInt(components[2], 10) || 4; // Default duration of 4/8ths
        time = time*900/16; // 900 is the base frequency of the PWM, i think
        return {
            note: components[1], //the note frequency in Hz
            time: time //for how long should it play
        };
    };
    port.pwmFrequency(25000);// The default frequency
    pin.pwmDutyCycle(0.99); //Play loudly!
    (function main(){
        if (!frequencies[index]) {
            port.pwmFrequency(10);// The default frequency
            //pin.pwmDutyCycle(0.1);
            pin.output();
            pin.write(false);
            return;
        }
        var beat = to_beat(frequencies[index]);

        if (beat.note != '.') { //play unless it's a silence beat
            var frequency = notes[beat.note];
            port.pwmFrequency(frequency);
        } else {
            port.pwmFrequency(1);
        }
        index++;
        setTimeout(main, beat.time);
    })();
};
var is_playing = false;


var testing = function(){
    port = tessel.port.GPIO;
    var ajax = require('./ajax.js');
    var config = require('./_config.js');
    use(0);
    console.log(
        'buzzer.js Test Interface***\r\n'+
        'Press tessel config button...'
    );
    tessel.button.on('press', function(time) {
        if(is_playing) return;
        is_playing = true;
        console.log('Play from remote');
        ajax({
            host: config.buzzer.echo_host,
            path: config.buzzer.echo_path,
            success: function(r){
                /* example of r is: 
                     d#2 f#4 d#2 B1 G#2 A#2 B1 c2 c#2 f4 c#2 A#2 F#2 G#1 A2 A#1 B2 d#3 B2 G#3 F1 F#2 G#2 A2 A#2 A1 A#2 B2 c#3 .1 c#3 c2 c#1 .1 d#2 f#4 d#2 B1 .1 G#1 A#2 B1 c2 c#2 f4 c#2 A#2 F#2 G#1 A2 A#1 B2 d#3 B2 G#3 F2 G#2 c#2 B1 A#5
                 */
                play(r);
                is_playing = false;
            }
        });
    });
};

if(module.parent && module.parent.parent) { //is required file
    module.exports.use = use;
    module.exports.play = play;
    module.exports.testing = testing;
} else {
    console.log('buzzer.js Local File Testing');
    testing();
}
