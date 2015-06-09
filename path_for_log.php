<?
include('config.php'); //not open source :p
$fin = fopen($config['log_path'], 'a');
$date_str = date("[Y-m-d H:i:s] ");
$message = $_GET['msg'];
$type = $_GET['type'];
if($type == "json"){
    $message = json_decode($message, true);
    $message = print_r($message, true);
}
fwrite($fin, $date_str.$message."\r\n");
fclose($fin);
?>
