<?php 
$dia = $_POST['dia'];
$entrada = $_POST['entrada'];
$saida = $_POST['saida'];
$horas = $_POST['horas'];
$resultado = $_POST['resultado'];

$arr = array('dia' => $dia, 'entrada' => $entrada, 'saida' => $saida, 'horas' => $horas, 'resultado' => $resultado);
$json = json_encode($arr); // Corrigir esta linha
file_put_contents("ponto.json", $json);
?>
