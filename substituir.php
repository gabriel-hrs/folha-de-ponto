<?php
header('Content-Type: application/json');

// Verifica se o arquivo foi enviado
if (!isset($_FILES['novo_arquivo'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nenhum arquivo enviado.']);
    exit;
}

$novoArquivo = $_FILES['novo_arquivo'];
$caminhoArquivo = 'ponto.json';
$caminhoBackup = 'ponto_backup.json';

// Verifica se o arquivo é realmente JSON
if ($novoArquivo['type'] !== 'application/json') {
    echo json_encode(['status' => 'error', 'message' => 'Arquivo inválido. Somente arquivos JSON são permitidos.']);
    exit;
}

// Lê o conteúdo do novo JSON antes de substituir
$conteudoNovoJson = file_get_contents($novoArquivo['tmp_name']);
$dadosNovos = json_decode($conteudoNovoJson, true);

// Verifica se o JSON é válido e contém dados esperados
if (!is_array($dadosNovos) || empty($dadosNovos)) {
    echo json_encode(['status' => 'error', 'message' => 'O arquivo JSON não contém dados válidos.']);
    exit;
}

// Faz um backup do arquivo atual antes de substituir
if (file_exists($caminhoArquivo)) {
    copy($caminhoArquivo, $caminhoBackup);
}

// Substitui o arquivo existente pelo novo
if (move_uploaded_file($novoArquivo['tmp_name'], $caminhoArquivo)) {
    echo json_encode(['status' => 'success', 'message' => 'Arquivo JSON substituído com sucesso. Backup criado.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao salvar o arquivo.']);
}
?>
