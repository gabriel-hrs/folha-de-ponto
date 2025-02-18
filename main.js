$('.input-group.date').datepicker({
    format: "dd/mm/yyyy",
    weekStart: 1,
    language: 'pt-BR',
    ignoreReadonly: true,
    autoclose: true,
    todayHighlight: true
}).datepicker('setDate', new Date());

$('#btn-resultado').on('click', function() {
    let entrada = $('#entrada').val();
    let saida = $('#saida').val();

    // Validação: Verifica se os campos de entrada e saída foram preenchidos
    if (entrada === '' || saida === '') {
        alert('Por favor, insira os horários de entrada e saída.');
        return;
    }

    // Cálculo de horas trabalhadas
    let entrada_hora = parseInt(entrada.split(':')[0]);
    let entrada_minuto = parseInt(entrada.split(':')[1]);

    let saida_hora = parseInt(saida.split(':')[0]);
    let saida_minuto = parseInt(saida.split(':')[1]);

    let horas = saida_hora - entrada_hora;
    let minutos = saida_minuto - entrada_minuto;

    if (minutos < 0) {
        horas -= 1;
        minutos += 60;
    }

    function zeroEsquerda(numero) {
        return numero < 10 ? '0' + numero : numero;
    }

    let horasFormatadas = zeroEsquerda(horas);
    let minutosFormatados = zeroEsquerda(minutos);

    $('#valor_horario').val(horasFormatadas + ':' + minutosFormatados);

    // Cálculo de horas mínimas esperadas (9h22 = 562 minutos)
    let minutosEsperadosTotais = 9 * 60 + 22;

    // Total de minutos trabalhados
    let minutosTrabalhados = horas * 60 + minutos;

    // Cálculo da diferença
    let resultadoMinutos = minutosTrabalhados - minutosEsperadosTotais;
    let resultadoHoras = Math.floor(Math.abs(resultadoMinutos) / 60);
    let resultadoRestanteMinutos = Math.abs(resultadoMinutos) % 60;

    // Formata horas e minutos com zero à esquerda
    resultadoHoras = zeroEsquerda(resultadoHoras);
    resultadoRestanteMinutos = zeroEsquerda(resultadoRestanteMinutos);

    // Define mensagem do resultado
    let resultadoMensagem = (resultadoMinutos < 0 ? 'horas a menos' : 'horas a mais');
    let resultado = (resultadoMinutos < 0 ? '-' : '+') + resultadoHoras + ':' + resultadoRestanteMinutos;

    // Atualiza o campo de resultado e aplica estilos
    $('#resultado_horario').val(resultado + ' (' + resultadoMensagem + ')');
    $('#resultado_horario').css('color', resultadoMinutos < 0 ? 'red' : 'green');
});

$('#btn-salvar').on('click', function() {
    let dia = document.getElementById('dia').value;
    let entrada = $('#entrada').val();
    let saida = $('#saida').val();
    let horas = $('#valor_horario').val();
    let resultado = $('#resultado_horario').val();

    if (dia == '' || entrada == '' || saida == '' || horas == '' || resultado == '') {
        alert('Preencha todos os campos');
        return;
    }

    let dados = {
        dia: dia,
        entrada: entrada,
        saida: saida,
        horas: horas,
        resultado: resultado
    };

    // Primeiro, verifica se a data já existe no arquivo JSON usando AJAX
    $.ajax({
        url: 'verificar_data.php', // Novo arquivo PHP para verificar
        type: 'POST',
        data: { dia: dia },
        success: function(response) {
            if (response.existe) {
                // Se a data já existe, exibe uma confirmação para sobrescrever
                if (confirm('O dia ' + dia + ' já está registrado. Deseja sobrescrevê-lo?')) {
                    // Se confirmado, envia os dados para salvar
                    salvarDados(dados);
                }
            } else {
                // Se a data não existe, salva diretamente
                salvarDados(dados);
            }
        }
    });
});

// Função para enviar os dados ao PHP e salvar
function salvarDados(dados) {
    $.ajax({
        url: 'salvar.php',
        type: 'POST',
        data: dados,
        success: function(response) {
            console.log(response, dados);
            alert('Arquivo salvo com sucesso!');
        }
    });
}

// Função para carregar os dados do arquivo JSON
async function carregarDados() {
    try {
        const response = await fetch('ponto.json');
        const dados = await response.json();

        const tabela = document.getElementById('tabela-dados').getElementsByTagName('tbody')[0];

        dados.forEach(item => {
            const linha = tabela.insertRow();
            const celula1 = linha.insertCell(0);
            const celula2 = linha.insertCell(1);
            // Adicione mais células conforme necessário

            celula1.textContent = item.campo1; // Substitua 'campo1' pelo nome do campo real
            celula2.textContent = item.campo2; // Substitua 'campo2' pelo nome do campo real
            // Preencha mais células conforme necessário
        });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

document.addEventListener('DOMContentLoaded', carregarDados);

$('#btn-novo-arquivo').on('click', function() {
    // Simula o clique no input de arquivo escondido
    $('#input-novo-arquivo').click();
});

// Quando o arquivo é selecionado
$('#input-novo-arquivo').on('change', function(event) {
    let arquivo = event.target.files[0]; // Pega o arquivo selecionado

    if (arquivo) {
        // Verifica se é um arquivo JSON
        if (arquivo.type !== 'application/json') {
            alert('Por favor, selecione um arquivo JSON válido.');
            return;
        }

        // Cria um objeto FormData para enviar o arquivo via AJAX
        let formData = new FormData();
        formData.append('novo_arquivo', arquivo);

        // Envia o arquivo para o servidor via AJAX
        $.ajax({
            url: 'substituir.php', // URL do arquivo PHP que fará a substituição do JSON
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                alert('Arquivo JSON substituído com sucesso!');
                location.reload(); // Recarrega a página para exibir os novos dados
            },
            error: function() {
                alert('Ocorreu um erro ao substituir o arquivo.');
            }
        });
    }
});

$('#btn-recarregar-pagina').on('click', function() {
    location.reload(); // Recarrega a página atual
});

document.getElementById('btn-notificacao').addEventListener('click', function() {
    // Pede permissão para enviar notificações
    if (Notification.permission === "granted") {
        agendarNotificacao();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                agendarNotificacao();
            }
        });
    } else {
        alert("As notificações estão bloqueadas no navegador. Habilite para receber alertas.");
    }
});

function agendarNotificacao() {
    let entrada = document.getElementById('entrada').value;

    if (!entrada) {
        alert("Por favor, insira o horário de entrada primeiro.");
        return;
    }

    // Convertendo entrada para horário de saída (9h22 depois)
    let [hora, minuto] = entrada.split(':').map(Number);
    let saidaMinutos = (hora * 60 + minuto) + (9 * 60 + 22); // Adiciona 9h22

    let horaSaida = Math.floor(saidaMinutos / 60);
    let minutoSaida = saidaMinutos % 60;

    let horarioSaida = `${horaSaida.toString().padStart(2, '0')}:${minutoSaida.toString().padStart(2, '0')}`;

    setTimeout(() => {
        new Notification("Hora de sair!", {
            body: `Seu horário de saída chegou: ${horarioSaida}`,
            icon: "/icon-192x192.png" // Ícone da notificação (ajuste conforme o PWA)
        });
    }, 5000); // Simulação: Notifica após 5 segundos (troque para o tempo real)
}
