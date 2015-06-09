//just an example
module.exports = {
    is_debug: false,
    wifi: {
        ssid: 'WifiSSID',
        password: 'password'
    },
    ajax: {
        host: 'grassboy.tw',
        port: 80
    },
    Console: {
        host: 'grassboy.tw',
        log_path: '/path_for_log.php',
        msg_path: '/path_for_send_msg.php'
    },
    buzzer: {
        echo_host: 'grassboy.tw',
        echo_path: '/buzzer.php'
    }
};
