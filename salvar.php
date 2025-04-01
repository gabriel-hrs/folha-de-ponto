<?php
header('Content-Type: application/json');

$dia = $_POST['dia'];
$entrada = $_POST['entrada'] ?? null;
$saida = $_POST['saida'] ?? null;
$horas = $_POST['horas'] ?? "";
$resultado = $_POST['resultado'] ?? "";

// Verifica se o arquivo JSON já existe
if (file_exists("ponto.json")) {
    // Carrega o conteúdo do JSON
    $jsonAtual = file_get_contents("ponto.json");
    $dados = json_decode($jsonAtual, true);
} else {
    $dados = []; // Se não existir, cria um array vazio
}

$diaExiste = false;

// Percorre os registros para verificar se a data já está salva
foreach ($dados as &$registro) {
    if ($registro['dia'] == $dia) {
        // Atualiza somente os campos que não estão vazios
        if ($entrada) $registro['entrada'] = $entrada;
        if ($saida) {
            $registro['saida'] = $saida;
            $registro['horas'] = $horas;
            $registro['resultado'] = $resultado;
        }
        $diaExiste = true;
        break;
    }
}

// Se a data não existir, cria um novo registro
if (!$diaExiste) {
    $novoRegistro = [
        'dia' => $dia,
        'entrada' => $entrada ?? "",
        'saida' => $saida ?? "",
        'horas' => $horas,
        'resultado' => $resultado
    ];
    $dados[] = $novoRegistro;
}

// Ordena os registros por data
usort($dados, function($a, $b) {
    $dataA = DateTime::createFromFormat('d/m/Y', $a['dia']);
    $dataB = DateTime::createFromFormat('d/m/Y', $b['dia']);
    return $dataA <=> $dataB;
});

// Salva o JSON atualizado
$json = json_encode($dados, JSON_PRETTY_PRINT);
file_put_contents("ponto.json", $json);

// Retorna uma resposta de sucesso
echo json_encode(['status' => 'success', 'message' => 'Dados salvos com sucesso.']);
?>
