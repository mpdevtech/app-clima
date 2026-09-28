# Tarefas de implementação — Clima

Fonte de verdade: [PRD do projeto](./prd.md). As referências abaixo indicam quais seções consultar; contratos, mensagens, campos e especificações visuais permanecem no PRD.

## Como executar

- Executar uma tarefa por vez, na ordem numérica. Cada tarefa depende da conclusão das anteriores.
- Antes de começar, ler as referências indicadas e verificar o código existente. Preservar alterações anteriores e implementar apenas o escopo da tarefa atual.
- Marcar `[x]` somente após cumprir todos os critérios de aprovação da tarefa. Implementação parcial ou validação bloqueada mantém `[ ]`.
- Ao concluir, registrar abaixo da tarefa os arquivos alterados, as verificações executadas e seus resultados. Informar limitações ou impedimentos para o próximo agente.
- Manter o projeto compilável e executar `npm run build` ao concluir cada tarefa que alterar código. Esse requisito é comum a todas as tarefas, além dos critérios específicos abaixo.
- Usar respostas controladas nos testes de borda; não depender de resultados reais variáveis da API. Não deixar dados simulados no fluxo de produção.
- Se surgir uma decisão de produto sem resposta no PRD, perguntar ao responsável antes de implementar essa decisão. Não ampliar o escopo nem alterar o PRD silenciosamente.

## Sequência de implementação

### T01 — Base da aplicação

- [ ] Preparar a estrutura vanilla TypeScript e o documento HTML.

**Referência:** [PRD](./prd.md), seção 5 — Stack e execução, Organização proposta e Estado e apresentação.

**Escopo:** adaptar a base existente, retirar da interface o conteúdo demonstrativo do Vite e preparar os módulos necessários, sem implementar consultas ainda.

**Critérios de aprovação:**

- O documento usa o idioma e o título definidos no PRD.
- A aplicação inicia com `npm run dev` sem erros no console e sem conteúdo demonstrativo visível.
- A estrutura respeita a separação proposta, sem introduzir framework, backend ou funcionalidades fora do escopo.
- O build de produção é gerado com sucesso.

### T02 — Contratos e suporte às verificações automatizadas

- [ ] Definir os tipos de localização, clima e estados da interface e preparar os testes.

**Referência:** [PRD](./prd.md), seções 4, 5 — Estado e apresentação, e 8.

**Escopo:** representar os contratos internos, incluindo metadados opcionais das localizações, e estabelecer um comando de testes reproduzível com fixtures reutilizáveis.

**Critérios de aprovação:**

- Os tipos representam todos os estados do PRD; sucesso exige localização e clima completos, e seleção contém a lista de opções.
- Dados externos entram como dados não validados; uma asserção TypeScript não substitui a validação em runtime a implementar nas próximas tarefas.
- Há fixtures para localização válida, homônimas, clima completo e valores zero, reutilizáveis nos testes seguintes.
- O comando de testes e a forma de simular `fetch` e tempo estão documentados no registro desta tarefa; o comando executa sem falhas. Não criar testes artificiais apenas para preencher a suíte.

### T03 — Serviço de geocodificação

- [ ] Implementar `searchCities` e validar as localizações retornadas.

**Referência:** [PRD](./prd.md), seção 4.1 e seção 5 — Serviço Open-Meteo.

**Escopo:** construir a URL, consultar o provedor, filtrar entradas inválidas e devolver opções válidas ou `null`. Implementar também o tratamento HTTP e o timeout compartilhável pelo serviço meteorológico.

**Critérios de aprovação:**

- Testes verificam `count=10`, `language=pt` e codificação de nomes com espaços e acentos.
- Entrada vazia ou inválida não executa `fetch`; coordenadas zero são aceitas nas respostas.
- Lista vazia, ausência de resultados ou lista totalmente inválida retornam `null`.
- Uma lista mista preserva somente as entradas válidas, sua ordem e metadados opcionais, sem eliminar homônimas pelo nome.
- Falha HTTP, rede, JSON inválido e timeout retornam `null`; timers são limpos e não há retries automáticos.
- A suíte cobre esses cenários e passa sem depender da API real.

### T04 — Serviço de condições atuais

- [ ] Implementar `getCurrentWeather` com validação completa do resultado.

**Referência:** [PRD](./prd.md), seção 4.2 e seção 5 — Serviço Open-Meteo.

**Escopo:** consultar o clima usando a localização recebida e aceitar apenas respostas completas conforme o contrato do PRD.

**Critérios de aprovação:**

- Testes inspecionam a requisição e confirmam coordenadas, timezone, variáveis solicitadas e unidades configuradas.
- Parâmetros ausentes ou inválidos não geram requisição.
- Testes parametrizados removem ou invalidam cada métrica obrigatória e cada unidade obrigatória exibida; todos esses casos retornam `null`.
- Zeros, temperaturas negativas e unidade vazia de `is_day` são aceitos; limites e tipos inválidos são rejeitados conforme o PRD.
- Um código meteorológico inteiro desconhecido não invalida um clima completo.
- Falhas HTTP, rede, parsing e timeout retornam `null`, com os testes passando.

### T05 — Descrições, ícones e formatação

- [ ] Implementar os utilitários de apresentação do clima.

**Referência:** [PRD](./prd.md), RF-03, RF-04, seção 4.3 e seção 5 — Estado e apresentação.

**Escopo:** mapear códigos meteorológicos, associar ícones e formatar números e dia atual no timezone da localização.

**Critérios de aprovação:**

- Todos os códigos listados no PRD possuem descrição em português; um código desconhecido retorna a descrição e o ícone neutros previstos.
- Dia/noite deriva de `is_day`, inclusive quando o horário do dispositivo sugerir o contrário.
- Testes de números verificam locale, arredondamento e preservação dos valores originais.
- Com um instante fixo próximo à virada do dia, testes em dois timezones confirmam as datas locais esperadas, independentemente do fuso do dispositivo.
- A suíte dos utilitários passa.

### T06 — Formulário e estados básicos

- [ ] Construir o formulário, o painel inicial, o loading e o estado sem resultado.

**Referência:** [PRD](./prd.md), RF-01, RF-05 e seção 6 — Composição obrigatória e Acessibilidade.

**Escopo:** criar a estrutura semântica e os renderizadores dos estados básicos, ainda sem conectar o fluxo completo às APIs.

**Critérios de aprovação:**

- Ao abrir a aplicação, campo e estado inicial aparecem com os textos do PRD e nenhuma requisição é disparada.
- Campo tem label associado; botão tem nome acessível; Enter e clique passam pelo mesmo handler de submit.
- Entrada vazia ou apenas com espaços mantém o estado inicial e o foco no campo; digitar não consulta a API.
- Renderizadores de loading e sem resultado podem ser verificados isoladamente, com região de status e `aria-busy` coerentes.
- As mensagens correspondem ao PRD e não há métricas fictícias na interface.

### T07 — Lista de localizações

- [ ] Construir a seleção acessível de resultados da geocodificação.

**Referência:** [PRD](./prd.md), seção 2, RF-02, RF-05, seção 4.1 e seção 6.

**Escopo:** renderizar as opções recebidas e emitir a localização escolhida para o controlador, sem consultar o clima dentro do componente.

**Critérios de aprovação:**

- Fixtures com múltiplos resultados exibem opções separadas na ordem recebida.
- Homônimas no mesmo estado e país são diferenciadas pelos dados administrativos disponíveis ou, quando os rótulos coincidem, pelas coordenadas.
- A ausência de metadados opcionais não produz textos como `undefined` nem elimina uma localização válida.
- Tab navega pelas opções; Enter, Espaço e clique selecionam o objeto correto, mesmo com nomes iguais.
- A lista anuncia sua disponibilidade, não mostra loading enquanto aguarda escolha e comporta textos longos sem corte.

### T08 — Painel de resultado completo

- [ ] Construir a sidebar e os quatro indicadores meteorológicos.

**Referência:** [PRD](./prd.md), RF-03, RF-04, seção 5 — Estado e apresentação, e seção 6.

**Escopo:** renderizar um resultado validado usando os utilitários existentes, com a hierarquia visual indicada no PRD.

**Critérios de aprovação:**

- Uma fixture completa exibe todas as informações exigidas na sidebar e nos quatro indicadores, com as unidades recebidas e a formatação definida.
- Fixtures com zeros, temperatura negativa, noite e código desconhecido mantêm valores e descrições corretos.
- Nome de cidade contendo marcação HTML aparece como texto, sem interpretar ou executar conteúdo.
- O painel inclui a atribuição e o link do provedor.
- O renderizador não realiza requisições e recebe apenas resultados completos.

### T09 — Integração do fluxo de busca

- [ ] Conectar formulário, serviços e renderizadores por meio dos estados da aplicação.

**Referência:** [PRD](./prd.md), RF-01 a RF-05 e seção 5 — Serviço Open-Meteo e Estado e apresentação.

**Escopo:** implementar a orquestração de zero, uma ou múltiplas localizações, seleção, sucesso e recuperação de falhas.

**Critérios de aprovação:**

- Testes de integração com serviços controlados verificam que zero opções não chama o clima e uma opção chama automaticamente, sem interromper o loading.
- Múltiplas opções interrompem o loading e não consultam clima até a escolha; depois dela, apenas a localização escolhida é consultada.
- Enter e botão produzem o mesmo fluxo; envios ou seleções repetidos durante requisição não duplicam chamadas.
- Nova busca na etapa de seleção substitui a lista anterior; iniciar busca após sucesso remove os dados anteriores.
- Falha em qualquer etapa ou resposta incompleta leva ao mesmo estado vazio, preserva a pesquisa e libera os controles; uma nova tentativa pode ter sucesso.
- Não há métricas parciais, loading permanente ou erros não tratados. Requisições e URLs permanecem exclusivamente no serviço Open-Meteo.

### T10 — Acabamento visual e responsividade

- [ ] Aplicar e conferir o layout final em todos os estados.

**Referência:** [PRD](./prd.md), seção 6 — Composição obrigatória, Parâmetros visuais e Responsividade.

**Escopo:** ajustar cores, tipografia, espaçamento, bordas, grid, sidebar e adaptação para telas pequenas.

**Critérios de aprovação:**

- Em desktop, busca e painel estão centralizados; o painel respeita 800 px incluindo padding, com sidebar à esquerda e indicadores à direita.
- Fundo, cantos, hierarquia e espaçamentos seguem a direção visual do PRD.
- Verificação em larguras de 320, 640 e 1280 px confirma ausência de rolagem horizontal, sobreposição ou corte em todos os estados.
- Textos longos e uma lista com 10 opções continuam legíveis e acessíveis; no mobile a composição se reorganiza conforme o PRD.
- Registrar as dimensões verificadas e evidências visuais, como capturas ou referências de inspeção, no registro da tarefa.

### T11 — Verificação de acessibilidade

- [ ] Revisar e corrigir a experiência completa com teclado e leitor de tela.

**Referência:** [PRD](./prd.md), seção 6 — Acessibilidade e comportamento da seleção; seção 7, critério 14.

**Escopo:** verificar a acessibilidade já incorporada nas tarefas anteriores e corrigir problemas encontrados no fluxo integrado.

**Critérios de aprovação:**

- É possível buscar, escolher uma localização e fazer nova busca usando somente teclado, com foco visível e sem bloqueio de navegação.
- Verificação com leitor de tela confirma nomes acessíveis e anúncios de loading, seleção e resultado, sem repetição desnecessária.
- Contraste do texto comum atinge o mínimo definido no PRD e os alvos de interação respeitam os tamanhos previstos.
- Ícones decorativos não poluem a leitura; informação não depende só de cor e animações respeitam movimento reduzido.
- Registrar ferramentas utilizadas, cenários verificados e resultados; verificações não executadas impedem marcar esta tarefa como concluída.

### T12 — Validação final e entrega

- [ ] Conferir a implementação contra todos os critérios de aceitação do PRD.

**Referência:** [PRD](./prd.md), seções 7 e 8.

**Escopo:** executar a validação integrada, corrigir regressões e registrar evidências finais, sem adicionar funcionalidades.

**Critérios de aprovação:**

- A suíte automatizada e `npm run build` passam; o build abre com `npm run preview` sem erros no console.
- Uma consulta real verifica a compatibilidade dos dois endpoints e apresenta resultado completo. Se houver incompatibilidade, registrar o problema e resolvê-lo antes de marcar a tarefa.
- Os cenários controlados da seção 8 estão cobertos, incluindo timeout e retomada após erro; não há mocks ativos em produção.
- Cada um dos 16 critérios da seção 7 tem uma evidência registrada por número, referenciando teste ou inspeção realizada, sem copiar o texto do PRD.
- Não existem falhas conhecidas que violem o PRD, e todas as tarefas anteriores estão aprovadas.

## Registro de conclusão

Ao concluir cada tarefa, acrescentar abaixo dela um registro curto neste formato:

```text
Conclusão: AAAA-MM-DD
Arquivos alterados: caminhos relevantes
Verificação: comandos ou cenários executados e resultados
Pendências: nenhuma, ou impedimentos que mantêm a tarefa desmarcada
```

Este arquivo planeja a implementação; nenhuma tarefa está considerada concluída apenas pela criação desta lista.
