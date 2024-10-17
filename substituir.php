<?php
// Verifica se o arquivo foi enviado
if (isset($_FILES['novo_arquivo'])) {
    $novoArquivo = $_FILES['novo_arquivo'];

    // Verifica se o arquivo é realmente JSON
    if ($novoArquivo['type'] !== 'application/json') {
        echo json_encode(['status' => 'error', 'message' => 'Arquivo inválido. Somente arquivos JSON são permitidos.']);
        exit;
    }

    // Define o caminho do arquivo de ponto existente
    $caminhoArquivo = 'ponto.json';

    // Substitui o arquivo existente pelo novo
    if (move_uploaded_file($novoArquivo['tmp_name'], $caminhoArquivo)) {
        echo json_encode(['status' => 'success', 'message' => 'Arquivo JSON substituído com sucesso.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Erro ao salvar o arquivo.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Nenhum arquivo enviado.']);
}
?>
