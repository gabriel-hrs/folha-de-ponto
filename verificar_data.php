<?php
$dia = $_POST['dia'];

if (file_exists("ponto.json")) {
    $jsonAtual = file_get_contents("ponto.json");
    $dados = json_decode($jsonAtual, true);

    // Verifica se a data já existe
    foreach ($dados as $registro) {
        if ($registro['dia'] == $dia) {
            echo json_encode(['existe' => true]);
            exit;
        }
    }
}

// Se não existir, retorna false
echo json_encode(['existe' => false]);