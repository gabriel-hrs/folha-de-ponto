<?php
$dia = $_POST['dia'];
$entrada = $_POST['entrada'];
$saida = $_POST['saida'];
$horas = $_POST['horas'];
$resultado = $_POST['resultado'];

// Verifica se o arquivo JSON já existe
if (file_exists("ponto.json")) {
    // Carrega o conteúdo do JSON
    $jsonAtual = file_get_contents("ponto.json");
    $dados = json_decode($jsonAtual, true); // Converte para array associativo
} else {
    $dados = array(); // Se não existir, cria um array vazio
}

// Verifica se a data já está registrada
foreach ($dados as $registro) {
    if ($registro['dia'] == $dia) {
        // Retorna um alerta se o dia já existir
        echo json_encode(['status' => 'exists', 'message' => "O dia $dia já está registrado. Deseja sobrescrever?"]);
        exit; // Encerra o script para evitar sobrescrita
    }
}

// Se a data não existir ou houver confirmação para sobrescrever, continua aqui
$novoRegistro = array(
    'dia' => $dia,
    'entrada' => $entrada,
    'saida' => $saida,
    'horas' => $horas,
    'resultado' => $resultado
);

// Adiciona o novo registro
$dados[] = $novoRegistro;

// Função para ordenar os registros por data
usort($dados, function($a, $b) {
    $dataA = DateTime::createFromFormat('d/m/Y', $a['dia']);
    $dataB = DateTime::createFromFormat('d/m/Y', $b['dia']);
    return $dataA <=> $dataB; // Ordena da mais antiga para a mais nova
});

// Converte o array de volta para JSON e salva o arquivo
$json = json_encode($dados, JSON_PRETTY_PRINT);
file_put_contents("ponto.json", $json);

// Retorna uma resposta de sucesso
echo json_encode(['status' => 'success', 'message' => 'Dados salvos com sucesso.']);
?>
