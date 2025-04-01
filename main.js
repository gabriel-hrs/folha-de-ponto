$('.input-group.date').datepicker({
    format: "dd/mm/yyyy",
    weekStart: 1,
    language: 'pt-BR',
    ignoreReadonly: true,
    autoclose: true,
    todayHighlight: true
}).datepicker('setDate', new Date());

// $('#btn-resultado').on('click', function() {
//     let entrada = $('#entrada').val();
//     let saida = $('#saida').val();

//     // Validação: Verifica se os campos de entrada e saída foram preenchidos
//     if (entrada === '' || saida === '') {
//         alert('Por favor, insira os horários de entrada e saída.');
//         return;
//     }

//     // Cálculo de horas trabalhadas
//     let entrada_hora = parseInt(entrada.split(':')[0]);
//     let entrada_minuto = parseInt(entrada.split(':')[1]);

//     let saida_hora = parseInt(saida.split(':')[0]);
//     let saida_minuto = parseInt(saida.split(':')[1]);

//     let horas = saida_hora - entrada_hora;
//     let minutos = saida_minuto - entrada_minuto;

//     if (minutos < 0) {
//         horas -= 1;
//         minutos += 60;
//     }

//     function zeroEsquerda(numero) {
//         return numero < 10 ? '0' + numero : numero;
//     }

//     let horasFormatadas = zeroEsquerda(horas);
//     let minutosFormatados = zeroEsquerda(minutos);

//     $('#valor_horario').val(horasFormatadas + ':' + minutosFormatados);

//     // Cálculo de horas mínimas esperadas (9h22 = 562 minutos)
//     let minutosEsperadosTotais = 9 * 60 + 22;

//     // Total de minutos trabalhados
//     let minutosTrabalhados = horas * 60 + minutos;

//     // Cálculo da diferença
//     let resultadoMinutos = minutosTrabalhados - minutosEsperadosTotais;
//     let resultadoHoras = Math.floor(Math.abs(resultadoMinutos) / 60);
//     let resultadoRestanteMinutos = Math.abs(resultadoMinutos) % 60;

//     // Formata horas e minutos com zero à esquerda
//     resultadoHoras = zeroEsquerda(resultadoHoras);
//     resultadoRestanteMinutos = zeroEsquerda(resultadoRestanteMinutos);

//     // Define mensagem do resultado
//     let resultadoMensagem = (resultadoMinutos < 0 ? 'horas a menos' : 'horas a mais');
//     let resultado = (resultadoMinutos < 0 ? '-' : '+') + resultadoHoras + ':' + resultadoRestanteMinutos;

//     // Atualiza o campo de resultado e aplica estilos
//     $('#resultado_horario').val(resultado + ' (' + resultadoMensagem + ')');
//     $('#resultado_horario').css('color', resultadoMinutos < 0 ? 'red' : 'green');
// });

// $('#btn-salvar').on('click', function() {
//     let dia = document.getElementById('dia').value;
//     let entrada = $('#entrada').val();
//     let saida = $('#saida').val();
//     let horas = $('#valor_horario').val();
//     let resultado = $('#resultado_horario').val();

//     if (dia == '' || entrada == '' || saida == '' || horas == '' || resultado == '') {
//         alert('Preencha todos os campos');
//         return;
//     }

//     let dados = {
//         dia: dia,
//         entrada: entrada,
//         saida: saida,
//         horas: horas,
//         resultado: resultado
//     };

//     // Primeiro, verifica se a data já existe no arquivo JSON usando AJAX
//     $.ajax({
//         url: 'verificar_data.php', // Novo arquivo PHP para verificar
//         type: 'POST',
//         data: { dia: dia },
//         success: function(response) {
//             if (response.existe) {
//                 // Se a data já existe, exibe uma confirmação para sobrescrever
//                 if (confirm('O dia ' + dia + ' já está registrado. Deseja sobrescrevê-lo?')) {
//                     // Se confirmado, envia os dados para salvar
//                     salvarDados(dados);
//                 }
//             } else {
//                 // Se a data não existe, salva diretamente
//                 salvarDados(dados);
//             }
//         }
//     });
// });

function salvarPonto(tipo) {
    let dia = document.getElementById('dia').value;
    let entrada = $('#entrada').val();
    let saida = $('#saida').val();

    if (!dia) {
        alert('Selecione um dia.');
        return;
    }

    if (tipo === 'entrada' && !entrada) {
        alert('Insira o horário de entrada.');
        return;
    }
    
    if (tipo === 'saida' && !saida) {
        alert('Insira o horário de saída.');
        return;
    }

    // Verifica se o dia já existe no JSON
    $.ajax({
        url: 'verificar_data.php', // Esse PHP deve retornar { existe: true/false, dados: {entrada, saida} }
        type: 'POST',
        data: { dia: dia },
        success: function(response) {
            let novoDados = {
                dia: dia,
                entrada: response.existe ? response.dados.entrada : "",
                saida: response.existe ? response.dados.saida : ""
            };

            if (tipo === 'entrada') {
                novoDados.entrada = entrada;

                // Calcula o horário de saída esperado
                let [hora, minuto] = entrada.split(':').map(Number);
                let novaHora = hora + 9;
                let novoMinuto = minuto + 22;

                if (novoMinuto >= 60) {
                    novaHora += 1;
                    novoMinuto -= 60;
                }

                let saidaEsperada = `${String(novaHora).padStart(2, '0')}:${String(novoMinuto).padStart(2, '0')}`;
                alert(`Seu horário de saída será às ${saidaEsperada}`);

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Aviso de saída', {
                        body: `Seu horário de saída é às ${saidaEsperada}`,
                        icon: 'icon-192x192.png'
                    });
                }
            } else if (tipo === 'saida') {
                novoDados.saida = saida;

                // Se já tem entrada, calcular as horas trabalhadas
                if (novoDados.entrada) {
                    let [entradaHora, entradaMinuto] = novoDados.entrada.split(':').map(Number);
                    let [saidaHora, saidaMinuto] = saida.split(':').map(Number);

                    let minutosTrabalhados = (saidaHora * 60 + saidaMinuto) - (entradaHora * 60 + entradaMinuto);
                    let minutosEsperadosTotais = 9 * 60 + 22; // 9h22 em minutos

                    let resultadoMinutos = minutosTrabalhados - minutosEsperadosTotais;
                    let resultadoHoras = Math.floor(Math.abs(resultadoMinutos) / 60);
                    let resultadoRestanteMinutos = Math.abs(resultadoMinutos) % 60;

                    // Formata o resultado
                    let resultadoMensagem = resultadoMinutos < 0 ? 'horas a menos' : 'horas a mais';
                    let resultado = (resultadoMinutos < 0 ? '-' : '+') + 
                        String(resultadoHoras).padStart(2, '0') + ':' + 
                        String(resultadoRestanteMinutos).padStart(2, '0');

                    // Exibe o resultado no campo de texto e ajusta a cor
                    $('#resultado_horario').val(resultado + ' (' + resultadoMensagem + ')');
                    $('#resultado_horario').css('color', resultadoMinutos < 0 ? 'red' : 'green');
                }
            }

            // Agora salva os dados no JSON sem sobrescrever a entrada ou saída existente
            $.ajax({
                url: 'salvar.php',
                type: 'POST',
                data: novoDados,
                success: function() {
                    alert('Ponto salvo com sucesso!');
                }
            });
        }
    });
}

// Eventos dos botões
$('#btn-resultado-entrada').on('click', function() {
    salvarPonto('entrada');
});

$('#btn-resultado-saida').on('click', function() {
    salvarPonto('saida');
});


// // Função para enviar os dados ao PHP e salvar
// function salvarDados(dados) {
//     $.ajax({
//         url: 'salvar.php',
//         type: 'POST',
//         data: dados,
//         success: function(response) {
//             console.log(response, dados);
//             alert('Arquivo salvo com sucesso!');
//         }
//     });
// }

// Função para carregar os dados do arquivo JSON
async function carregarDados() {
    try {
        const tabela = document.getElementById('tabela-dados');

        // Se a tabela não existir, não faz nada
        if (!tabela) {
            console.error('Elemento #tabela-dados não encontrado.');
            return;
        }

        const response = await fetch('ponto.json');
        if (!response.ok) throw new Error('Erro ao carregar o arquivo JSON.');

        const dados = await response.json();

        // Limpa a tabela antes de inserir novos dados
        tabela.innerHTML = '';

        dados.forEach(item => {
            const linha = tabela.insertRow();
            linha.insertCell(0).textContent = item.dia || '—';
            linha.insertCell(1).textContent = item.entrada || '—';
            linha.insertCell(2).textContent = item.saida || '—';
            linha.insertCell(3).textContent = item.horas || '—';
            linha.insertCell(4).textContent = item.resultado || '—';
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

// document.getElementById('btn-notificacao').addEventListener('click', function () {
//     let entrada = document.getElementById('entrada').value;

//     if (!entrada) {
//         alert('Por favor, insira o horário de entrada.');
//         return;
//     }

//     let [hora, minuto] = entrada.split(':').map(Number);

//     // Adiciona 9 horas e 22 minutos ao horário de entrada
//     let novaHora = hora + 9;
//     let novoMinuto = minuto + 22;

//     if (novoMinuto >= 60) {
//         novaHora += 1;
//         novoMinuto -= 60;
//     }

//     // Ajuste para formato HH:MM
//     let saidaFormatada = `${String(novaHora).padStart(2, '0')}:${String(novoMinuto).padStart(2, '0')}`;

//     // Exibe alerta com o horário de saída
//     alert(`Seu horário de saída será às ${saidaFormatada}`);

//     // Enviar notificação push (se permitido pelo usuário)
//     if ('Notification' in window && Notification.permission === 'granted') {
//         new Notification('Aviso de saída', {
//             body: `Seu horário de saída é às ${saidaFormatada}`,
//             icon: 'icon-192x192.png'
//         });
//     } else if (Notification.permission !== 'denied') {
//         Notification.requestPermission().then(permission => {
//             if (permission === 'granted') {
//                 new Notification('Aviso de saída', {
//                     body: `Seu horário de saída é às ${saidaFormatada}`,
//                     icon: 'icon-192x192.png'
//                 });
//             }
//         });
//     }
// });
