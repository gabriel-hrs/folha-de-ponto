
$('.input-group.date').datepicker({
    format: "dd/mm/yyyy",
    weekStart: 1,              
    language: 'pt_BR'
});

$('#btn-resultado').on('click', function() {
    let entrada = $('#entrada').val();
    let saida = $('#saida').val();

    // Validação: Verifica se os campos de entrada e saída foram preenchidos
    if (entrada === '' || saida === '') {
        alert('Por favor, insira os horários de entrada e saída.');
        return;
    }

    // Continue com o cálculo de horas trabalhadas
    let entrada_hora = parseInt(entrada.split(':')[0]);
    let entrada_minuto = parseInt(entrada.split(':')[1]);

    let saida_hora = parseInt(saida.split(':')[0]);
    let saida_minuto = parseInt(saida.split(':')[1]);

    let horas = saida_hora - entrada_hora;
    let minutos = saida_minuto - entrada_minuto;

    function zeroEsquerda(numero) {
        return numero < 10 ? '0' + numero : numero;
    }
    horas = zeroEsquerda(horas);
    minutos = zeroEsquerda(minutos);

    if (minutos < 0) {
        horas -= 1;
        minutos = 60 + minutos;
    }

    $('#valor_horario').val(horas + ':' + minutos);
    // Continue com o restante do código
});

$('#btn-salvar').on('click', function() {
    let dia = document.getElementById('dia').value;
    let entrada = $('#entrada').val();
    let saida = $('#saida').val();
    let horas = $('#valor_horario').val();
    let resultado = $('#resultado_horario').val();

    // Validação: Verifica se as horas foram calculadas
    if (horas === '' || resultado === '') {
        alert('Por favor, calcule as horas antes de salvar.');
        return;
    }

    // Validação: Verifica se os campos obrigatórios estão preenchidos
    if (dia === '' || entrada === '' || saida === '' || horas === '' || resultado === '') {
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

    $.ajax({
        url: 'salvar.php',
        type: 'POST',
        data: dados,
        success: function(response) {
            console.log(response, dados);
            alert('Arquivo salvo com sucesso!');
        }
    });
});


// Função para sobrescrever os dados se o usuário confirmar
function sobrescreverDados(dados) {
    $.ajax({
        url: 'sobrescrever.php', // Pode ser o mesmo salvar.php ou um separado
        type: 'POST',
        data: dados,
        success: function(response) {
            let result = JSON.parse(response);
            alert(result.message); // Mensagem de sucesso
        }
    });
}
