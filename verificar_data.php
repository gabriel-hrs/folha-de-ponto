<?php
header('Content-Type: application/json');

$dia = $_POST['dia'];

if (file_exists("ponto.json")) {
    $jsonAtual = file_get_contents("ponto.json");
    $dados = json_decode($jsonAtual, true);

    // Verifica se a data já existe e retorna os horários
    foreach ($dados as $registro) {
        if ($registro['dia'] == $dia) {
            echo json_encode([
                'existe' => true,
                'dados' => [
                    'entrada' => $registro['entrada'] ?? "",
                    'saida' => $registro['saida'] ?? ""
                ]
            ]);
            exit;
        }
    }
}

// Se não existir, retorna false
echo json_encode(['existe' => false]);
?>
