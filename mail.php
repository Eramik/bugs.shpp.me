<?php
$regular = $_GET['regular'];
$result_url = $_GET['result_url'];
$email = $_GET['email'];
$money = $_GET['money'];

if($email)
    if($regular == "true")
        $subject = 'Новый постоянный донейтор с bugs.shpp.me';
    else
        $subject = 'Новый не анонимный донейтор с bugs.shpp.me';
else
    $subject = 'Была куплена картинка на bugs.shpp.me';

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: info@programming.kr.ua". "\r\n";
//$infomail = "info@programming.kr.ua";
$infomail = "kboyko1999@gmail.com";

if($email)
    $message = "<b>Email: </b>$email \r\n <br>";

$message.= "Сделал себе вот такого жука: <a href='" .$result_url ."'>" . $result_url . "</a> :) <br/>";
$message.= "За " . $money . " грн";
mail($infomail, $subject, $message, $headers);
?>