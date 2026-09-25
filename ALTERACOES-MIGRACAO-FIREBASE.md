# Migração do modo convidado para a conta Google

## Objetivo

Esta versão corrige a colisão causada pelo caminho antigo `pontos/{data}` e implementa a opção B: o convidado pode registrar pontos e, ao entrar com Google, levar seus dados para a conta definitiva.

Os arquivos originais não foram alterados. As versões preparadas para implantação são:

- `main.atualizado.js`
- `firestore.atualizado.rules`

## Nova estrutura no Firestore

Antes, todos os usuários disputavam o mesmo documento de cada data:

```text
pontos/2026-09-22
```

Agora, cada UID possui sua própria subcoleção:

```text
usuarios/{uid}/pontos/2026-09-22
```

Os conflitos de migração são preservados em:

```text
usuarios/{uidGoogle}/conflitosPontos/{idDoConflito}
```

A coleção antiga `pontos` não é apagada.

## Alterações no `main.js`

### 1. Leituras e gravações isoladas por usuário

Foram criadas as funções `referenciaPonto()` e `colecaoPontos()`. As telas de entrada, saída e histórico agora trabalham exclusivamente em `usuarios/{uid}/pontos`.

Isso permite que um convidado e uma conta Google tenham registros diferentes na mesma data sem receber `permission-denied`.

### 2. Migração dos registros antigos

Ao iniciar, a aplicação consulta a coleção antiga usando o filtro `ownerUid == UID atual`. Cada registro do próprio usuário é copiado para o novo caminho somente se ainda não existir lá.

- Nenhum documento antigo é excluído.
- Um documento novo existente nunca é sobrescrito silenciosamente.
- Se houver diferença entre o registro antigo e o novo, as duas versões são arquivadas em `conflitosPontos` e o novo caminho é mantido.

### 3. Conversão de convidado para Google

Antes de tentar vincular o Google, o aplicativo cria na sessão da aba uma cópia temporária dos pontos e da configuração do convidado.

Há dois resultados possíveis:

1. A conta Google ainda não existia no Firebase: a vinculação mantém o mesmo UID. Não é necessário copiar documentos.
2. A conta Google já pertencia a outro UID: o aplicativo entra nessa conta e copia os dados do convidado para ela.

O backup temporário usa `sessionStorage`; ele não contém senha nem token de acesso. Ele é removido depois que a migração termina. Não feche a aba enquanto uma migração estiver em andamento.

### 4. Datas duplicadas

Quando convidado e Google possuem dados diferentes para a mesma data, o aplicativo pergunta qual registro deve aparecer no histórico:

- **Confirmar:** substitui o ponto visível da conta Google pelo ponto do convidado.
- **Cancelar:** mantém o ponto que já estava na conta Google.

Nos dois casos, as duas versões são arquivadas em `conflitosPontos` antes da decisão ser aplicada.

### 5. Configuração do convidado

Se a conta Google não possuir configuração, a configuração do convidado é copiada. Se ambas possuírem configuração, a versão do Google é mantida e a versão do convidado é arquivada como conflito.

### 6. Login com popup e redirect

O fluxo trata tanto popup quanto redirect. Quando `linkWithPopup()` informa que a credencial Google já está em uso, o código recupera a credencial do erro, entra na conta existente e inicia a mesclagem.

O arquivo importa `getRedirectResult` e `signInWithCredential` da versão `10.12.4`, a mesma versão já usada pelo `main.js` para o Firestore. Mantenha o `firebase-config.js` na mesma versão do SDK.

## Alterações nas regras

As novas regras:

- permitem acesso a `usuarios/{uid}/pontos` somente quando o UID do caminho é o UID autenticado;
- exigem que `ownerUid` continue igual ao proprietário em criações e atualizações;
- protegem os arquivos de conflito da mesma forma;
- impedem exclusões feitas pelo cliente;
- corrigem a falha antiga que permitia uma atualização baseada apenas no novo `ownerUid`;
- mantêm a coleção antiga compatível durante a implantação, mas com criação e atualização restritas ao proprietário.

Essa compatibilidade temporária é importante porque um Service Worker antigo ainda pode entregar a versão anterior do JavaScript durante a publicação.

## Ordem de implantação

1. Faça um backup/exportação do Firestore ou, no mínimo, confirme que a coleção `pontos` está preservada.
2. No Firebase Console, abra **Firestore Database > Rules**.
3. Publique o conteúdo completo de `firestore.atualizado.rules`.
4. No repositório, substitua o conteúdo do `main.js` pelo conteúdo de `main.atualizado.js`.
5. Atualize a versão do cache no `service-worker.js` para forçar a entrega do JavaScript novo.
6. Faça commit e push.
7. Aguarde o GitHub Pages concluir a publicação.
8. Remova o Service Worker/cache antigo no navegador de teste e recarregue.

Não publique o JavaScript novo antes das regras: os novos caminhos ainda não terão permissão. As regras fornecidas mantêm o cliente antigo funcional durante a transição.

## Roteiro de validação

Use datas de teste que não contenham informações importantes.

### Teste 1 — conta Google existente

1. Entre diretamente com Google.
2. Confirme que os pontos antigos aparecem.
3. No Firestore, verifique se eles foram copiados para `usuarios/{uidGoogle}/pontos`.
4. Confirme que a coleção antiga continua intacta.

### Teste 2 — convidado separado

1. Abra uma janela anônima do navegador.
2. Permaneça como convidado.
3. Registre entrada e saída em uma data de teste.
4. Confirme que o documento foi criado em `usuarios/{uidConvidado}/pontos`.

### Teste 3 — convidado para Google, sem conflito

1. Ainda como convidado, registre uma data que não exista na conta Google.
2. Clique para entrar com Google.
3. Selecione a conta Google existente.
4. Confirme que o registro aparece na conta Google e em `usuarios/{uidGoogle}/pontos`.

### Teste 4 — convidado para Google, com conflito

1. Crie dados diferentes na mesma data no convidado e no Google.
2. Faça a conversão do convidado para Google.
3. Teste primeiro **Cancelar** para manter o Google.
4. Em outro teste, use **Confirmar** para usar o convidado.
5. Confirme que `usuarios/{uidGoogle}/conflitosPontos` contém as duas versões.

### Teste 5 — segurança

1. Confirme que um UID não consegue ler `usuarios/{outroUid}/pontos`.
2. Confirme que alterar `ownerUid` de um documento existente é recusado.
3. Confirme que exclusões pelo cliente são recusadas.

## Limitações e cuidados

- Pontos que receberam `permission-denied` antes desta correção não foram gravados e não podem ser recuperados do Firestore.
- Se o usuário apagar os dados do navegador antes de vincular a conta anônima, poderá perder o acesso ao UID convidado.
- A aplicação não apaga automaticamente a origem anônima. Depois da troca para um UID Google já existente, o cliente não possui mais permissão para excluir os documentos do UID anterior. Isso preserva os dados e evita perda acidental.
- O histórico antigo é migrado pelo próprio usuário quando ele abre a aplicação autenticado. Uma migração administrativa de todos os usuários exigiria um ambiente confiável com Firebase Admin SDK; não deve ser feita no navegador.

## Endurecimento posterior das regras

Depois que o JavaScript novo estiver propagado e o Service Worker antigo não estiver mais em uso, a coleção antiga pode se tornar estritamente somente leitura. No bloco `match /pontos/{docId}`, substitua as regras de `create` e `update` por:

```text
allow create, update, delete: if false;
```

Faça isso somente depois de validar a migração e manter um backup da coleção antiga.

## Validação técnica realizada

- O JavaScript passou na verificação sintática com `node --check`.
- Todas as referências operacionais de entrada, saída, busca diária e histórico foram direcionadas à nova estrutura.
- A única consulta restante à coleção antiga está dentro da rotina explícita de migração.
- As regras foram revisadas para separar leitura, criação, atualização e exclusão.

Referências oficiais:

- Firebase Auth — vinculação de provedores: https://firebase.google.com/docs/auth/web/account-linking
- Firestore — regras e consultas seguras: https://firebase.google.com/docs/firestore/security/rules-query
