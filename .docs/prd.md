# PRD — Clima

## 1. Objetivo e contexto

Criar uma aplicação web para consultar as condições meteorológicas atuais de uma cidade. O usuário informa o nome, realiza uma busca e recebe um resumo com temperatura, sensação térmica, umidade, probabilidade de precipitação e vento.

Este documento consolida o [brain dump](./brain-dump.md) e as decisões confirmadas pelo responsável pelo projeto. Define o escopo da primeira versão, os comportamentos esperados e os critérios para validar a implementação.

### Decisões confirmadas

- Interface, mensagens e descrições meteorológicas em português brasileiro (`pt-BR`). Geocodificação com `language=pt`.
- Busca por Enter ou botão de busca, solicitando até 10 localizações (`count=10`) e permitindo escolher quando houver múltiplos resultados.
- Cidade não encontrada, clima indisponível ou qualquer métrica obrigatória ausente resultam no mesmo estado vazio de busca sem resultado. Não haverá exibição parcial.
- Vite, TypeScript e JavaScript vanilla, sem framework de interface.
- Integração com Open-Meteo encapsulada em um arquivo de serviço.
- Busca acima do painel; painel branco com sidebar à esquerda, área principal e largura máxima de 800 px; fundo da página cinza escuro.

### Ajustes de consistência do brain dump

A repetição de `wind_speed_10m` na lista original foi removida. `wind_direction_10m` e `weather_code` são obrigatórios porque aparecem no endpoint e são necessários às informações visuais solicitadas. O timezone deve vir da cidade encontrada; `America/Sao_Paulo` no exemplo não deve ser fixado no código.

## 2. Escopo funcional

### Dentro da primeira versão

- Pesquisa por nome de cidade com até 10 resultados da geocodificação (`count=10`). Havendo mais de uma localização válida, o usuário escolhe qual consultar; com apenas uma, a consulta segue automaticamente.
- Consulta sequencial de localização e clima, com etapa de escolha quando houver múltiplas localizações.
- Exibição de todas as informações obrigatórias após validação completa.
- Estados inicial, carregando, seleção de localização, sucesso e sem resultado.
- Interface responsiva, uso por teclado e mensagens acessíveis.
- Tradução local dos códigos meteorológicos para descrições em português.

### Fora do escopo

Autocomplete, geolocalização do dispositivo, mapas, previsão por hora ou por vários dias, favoritos, histórico persistente, contas, alternância de unidades, atualização automática e suporte offline.

A busca apresenta até 10 localizações na ordem retornada pelo provedor; não garante listar todas as cidades homônimas existentes. Identificar cada opção por nome, estado/região e país; acrescentar município ou outras divisões administrativas disponíveis para distinguir homônimas. Se os rótulos ainda coincidirem, mostrar latitude e longitude. Não agrupar nem eliminar resultados apenas por terem o mesmo nome.

## 3. Jornada e requisitos funcionais

### RF-01 — Entrada e envio

Apresentar um formulário com campo rotulado “Cidade”, placeholder “Digite o nome da cidade” e botão de busca integrado visualmente ao campo. Enter e clique no botão devem acionar o mesmo fluxo de submit.

Remover espaços das extremidades antes da consulta. Entrada vazia ou composta somente por espaços não deve gerar requisições: manter o estado inicial e o foco no campo. Não pesquisar durante a digitação.

### RF-02 — Busca e seleção de localização

1. Ao enviar uma entrada válida, entrar em carregamento e retirar os dados anteriores do painel.
2. Consultar a geocodificação com o nome informado.
3. Validar as localizações retornadas e extrair nome, latitude, longitude, código do país, timezone e dados administrativos disponíveis. Descartar entradas inválidas; se nenhuma for válida, exibir o estado sem resultado.
4. Com uma localização válida, consultar seu clima automaticamente. Com mais de uma, encerrar o loading e apresentar a lista para escolha; somente após a seleção iniciar novo loading e consultar o clima usando as coordenadas e o timezone da opção escolhida.
5. Validar todos os dados necessários antes de atualizar a interface.
6. Exibir o painel completo em caso de sucesso; caso contrário, exibir o estado vazio de busca sem resultado.

Com uma única localização, o loading permanece ativo entre as duas requisições. Com múltiplas, interromper o loading enquanto o usuário escolhe, sem consultar antecipadamente o clima das opções. Durante requisições, desabilitar envio e seleção para evitar duplicidade e reabilitar os controles ao finalizar. Na etapa de escolha, permitir uma nova busca, substituindo a lista anterior. O painel meteorológico só aparece após a consulta completa da localização escolhida.

### RF-03 — Resumo na sidebar

Exibir, nesta ordem de hierarquia:

- Temperatura atual, em destaque, com sua unidade.
- Nome da cidade e código do país, por exemplo “Upanema, BR”.
- Dia atual na cidade consultada, formatado em `pt-BR`, incluindo dia da semana e data.
- “Dia” quando `is_day` for `1` ou “Noite” quando for `0`, acompanhado de ícone coerente.
- Descrição meteorológica derivada de `weather_code`. O número do código não precisa aparecer na interface.

O dia atual deve ser calculado com o timezone da cidade, sem depender do fuso do dispositivo. O indicador dia/noite deve respeitar exclusivamente `is_day`, sem inferência pelo horário.

### RF-04 — Indicadores na área principal

Exibir quatro blocos identificados por rótulos legíveis:

- “Umidade relativa”: `relative_humidity_2m` e unidade percentual.
- “Sensação térmica”: `apparent_temperature` e unidade de temperatura.
- “Probabilidade de precipitação”: `precipitation_probability` e unidade percentual.
- “Vento”: `wind_speed_10m` com unidade de velocidade e `wind_direction_10m` com unidade angular.

Apresentar a direção em graus para manter a interpretação direta dos dados recebidos. Usar formatação numérica `pt-BR`, com até uma casa decimal para temperaturas e velocidade e até zero casas para percentuais e direção. Arredondar somente na apresentação.

### RF-05 — Estados da interface

- **Inicial:** painel sem métricas, mensagem “Consulte o clima de uma cidade” e orientação “Digite uma cidade no campo acima para começar”. Não buscar uma cidade automaticamente.
- **Carregando:** indicador visual e texto “Buscando cidades...” na geocodificação ou “Buscando clima...” na consulta meteorológica, mantendo o painel e o campo no layout.
- **Seleção de localização:** mensagem “Selecione a localização” e lista das opções válidas, com os identificadores definidos no escopo. Aguardar a escolha sem loading e sem exibir métricas meteorológicas.
- **Sucesso:** sidebar e quatro blocos completos, todos referentes à mesma busca.
- **Sem resultado:** usar sempre o mesmo componente e mensagem “Nenhum resultado encontrado”, com orientação “Confira o nome da cidade e tente novamente”. Aplicar a cidade ausente, ausência de localizações válidas, clima ausente, métricas incompletas, parâmetros inválidos, falhas HTTP, rede, timeout ou resposta inválida.

Não manter valores de uma consulta anterior no estado sem resultado. Preservar o texto pesquisado para permitir correção. Não mostrar zeros artificiais, métricas parciais nem detalhes técnicos de erro ao usuário.

## 4. Integração e contratos de dados

### 4.1 Geocodificação

Endpoint:

```text
https://geocoding-api.open-meteo.com/v1/search?name={CIDADE}&count=10&language=pt&format=json
```

Construir a URL com `URL` e `URLSearchParams`, codificando acentos, espaços e caracteres especiais. Processar a lista `results`, com até 10 entradas, preservando sua ordem. Não selecionar automaticamente a primeira quando houver múltiplas localizações válidas.

Dados obrigatórios da localização:

- `name`: string não vazia.
- `latitude`: número finito entre -90 e 90.
- `longitude`: número finito entre -180 e 180.
- `country_code`: string com código do país.
- `timezone`: string de timezone utilizável para consulta e formatação.

Ausência de `results`, lista vazia ou nenhuma localização válida encerram a busca sem chamar o endpoint meteorológico. Preservar também `id`, `country` e divisões administrativas como `admin1`, `admin2`, `admin3` e `admin4`, quando presentes, para identificar as opções. Esses campos adicionais são opcionais: usar o código do país quando o nome não vier e as coordenadas para diferenciar rótulos coincidentes. Vincular a seleção ao objeto da localização, nunca somente ao nome. População e elevação não são necessárias.

Referência: [documentação de geocodificação do Open-Meteo](https://open-meteo.com/en/docs/geocoding-api).

### 4.2 Condições atuais

Endpoint parametrizado:

```text
https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=relative_humidity_2m,temperature_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code&timezone={TIMEZONE}&temperature_unit=celsius&wind_speed_unit=kmh
```

Enviar o timezone retornado pela geocodificação, codificado por `URLSearchParams`. Solicitar explicitamente Celsius e km/h. A documentação permite usar as variáveis horárias nas condições atuais, incluindo a probabilidade de precipitação; portanto, manter essa variável em `current`, conforme o brain dump. Referência: [documentação de previsão do Open-Meteo](https://open-meteo.com/en/docs).

Validar a presença de `current` e `current_units`. Os oito valores meteorológicos obrigatórios são:

```text
temperature_2m
apparent_temperature
relative_humidity_2m
is_day
wind_speed_10m
wind_direction_10m
precipitation_probability
weather_code
```

Todos devem ser números finitos. Validar `is_day` como 0 ou 1, percentuais entre 0 e 100, velocidade não negativa, direção entre 0 e 360 e código meteorológico inteiro. Temperaturas negativas são válidas.

Ler as unidades das propriedades correspondentes em `current_units`; exigir unidades válidas para as métricas exibidas. `is_day` é adimensional e sua unidade vazia é válida; `weather_code` é interpretado por mapeamento, sem exibir sua unidade técnica. Não confundir zero com ausência: temperatura 0, precipitação 0%, direção 0°, código 0 e `is_day=0` devem ser aceitos.

`null`, propriedade ausente, tipo incorreto ou unidade obrigatória ausente invalidam o resultado inteiro. Um código meteorológico numérico desconhecido deve receber a descrição “Condição meteorológica desconhecida” e ícone neutro, sem impedir a exibição das demais métricas válidas.

### 4.3 Mapeamento meteorológico

Manter um dicionário local baseado nos códigos do brain dump:

```text
0: Céu limpo
1: Predominantemente limpo
2: Parcialmente nublado
3: Encoberto
45: Nevoeiro
48: Nevoeiro com formação de geada
51: Garoa leve
53: Garoa moderada
55: Garoa intensa
56: Garoa congelante leve
57: Garoa congelante intensa
61: Chuva leve
63: Chuva moderada
65: Chuva forte
66: Chuva congelante leve
67: Chuva congelante forte
71: Neve leve
73: Neve moderada
75: Neve forte
77: Grãos de neve
80: Pancadas de chuva leves
81: Pancadas de chuva moderadas
82: Pancadas de chuva intensas
85: Pancadas de neve leves
86: Pancadas de neve fortes
95: Trovoada
96: Trovoada com granizo leve
97: Trovoada forte
99: Trovoada com granizo forte
```

Agrupar ícones por condição, mantendo textos distintos por código. Para céu limpo ou parcialmente nublado, o ícone pode variar conforme `is_day`. Ícones não substituem as descrições textuais.

## 5. Requisitos de sistema e detalhes técnicos

### Stack e execução

- Aplicação frontend com Vite, TypeScript e APIs nativas do navegador; HTML e CSS para estrutura e apresentação.
- Respeitar as versões e a configuração presentes no projeto. O ambiente de desenvolvimento precisa de Node.js e npm compatíveis com o Vite instalado.
- Scripts existentes: `npm run dev` para desenvolvimento, `npm run build` para checagem TypeScript e geração de produção e `npm run preview` para inspeção do build.
- Navegador com suporte a ES2023, módulos, Fetch, AbortController e Intl, em consonância com o target atual do TypeScript.
- Hospedagem estática do build, acesso à internet e disponibilidade dos endpoints Open-Meteo.
- Sem banco de dados ou backend no escopo. Não armazenar credenciais no frontend; eventual uso comercial deve verificar as condições e a infraestrutura de acesso do provedor antes da publicação.

### Organização proposta

```text
src/
  main.ts                  # inicialização, formulário e transições de estado
  style.css                # layout, componentes e responsividade
  services/open-meteo.ts    # requisições, validações e composição da busca
  types/weather.ts         # contratos de localização, clima e resultado
  utils/weather-code.ts    # descrições e associação de ícones
  utils/formatters.ts      # números e data no timezone da cidade
```

Esta divisão orienta a implementação; a exigência central é concentrar o acesso ao Open-Meteo no serviço. Componentes de interface e `main.ts` não devem construir URLs nem executar `fetch` diretamente.

### Serviço Open-Meteo

Prever funções equivalentes a:

```text
searchCities(name) → lista de localizações válidas ou null
getCurrentWeather(location) → clima completo e validado ou null
```

As funções devem validar os próprios parâmetros antes de realizar I/O. Coordenadas zero são válidas. Ausência ou invalidade de parâmetros retorna `null`, sem requisição. A busca de cidades retorna `null` quando não há opções válidas. O controlador da interface chama o serviço de geocodificação e, após seleção automática de uma única opção ou escolha pelo usuário, chama o serviço meteorológico. O sucesso exige localização e clima completos; todas as requisições e validações permanecem no serviço.

Tratar respostas externas como dados não confiáveis, validando seu conteúdo em runtime além das interfaces TypeScript. Verificar `response.ok` antes de consumir uma resposta como sucesso e capturar falhas de rede, parsing e validação.

Usar timeout finito com `AbortController`; adotar 15 segundos por requisição como parâmetro inicial de implementação. Timeout produz o mesmo resultado `null`. Não realizar retries automáticos na primeira versão. Garantir limpeza dos timers e saída de loading em todos os caminhos, inclusive exceções.

### Estado e apresentação

Representar explicitamente os estados `idle`, `loading`, `selecting`, `success` e `empty`. O estado `selecting` contém as opções válidas da busca atual. O estado de sucesso contém localização e clima completos. Renderizar textos vindos da API com `textContent` ou mecanismo equivalente que não interprete HTML.

Usar `Intl.NumberFormat('pt-BR')` para números e `Intl.DateTimeFormat('pt-BR', { timeZone: location.timezone, ... })` para o dia atual. Não interpretar uma string de hora local da API como se estivesse no timezone do navegador.

Configurar o documento com `lang="pt-BR"` e título “Clima”. Incluir atribuição discreta e link para Open-Meteo no rodapé do painel, observando os termos aplicáveis do provedor.

## 6. Instruções visuais e experiência

### Composição obrigatória

O fundo da página deve ser cinza escuro. Centralizar horizontalmente a busca e o painel, com margem superior e espaço entre ambos. A região superior não tem fundo próprio; contém somente o campo e seu botão de busca integrado.

Sidebar e área principal compartilham um único painel branco com cantos bem arredondados e largura máxima de 800 px, incluindo padding. O painel deve respeitar margens laterais em telas menores.

Em desktop, posicionar a sidebar à esquerda e os quatro indicadores em grade de duas colunas à direita. Dar maior destaque à temperatura atual; nome da cidade vem em seguida. Usar rótulos menores que os valores, com contraste suficiente.

Durante a seleção, substituir o conteúdo meteorológico do painel por uma lista vertical de opções. Cada opção deve ser um botão com nome em destaque e informações de localização abaixo, aceitando quebra de linha. Garantir navegação com Tab, ativação por Enter ou Espaço e foco visível. Ao abrir a lista, anunciar sua disponibilidade e permitir acesso direto à primeira opção.

### Parâmetros visuais sugeridos para implementação

Os valores abaixo detalham a direção já definida, sem exigir uma biblioteca visual:

- Fundo da página: `#242424`; painel: `#FFFFFF`.
- Texto principal: `#202020`; secundário: `#626262`; divisórias: `#E5E7EB`.
- Raio do painel: 28 px; campo e blocos internos: 12 a 16 px.
- Padding do painel: 32 px no desktop e 20 px no mobile.
- Distância entre busca e painel: 24 px; espaçamento interno em múltiplos de 8 px.
- Sidebar com aproximadamente 35% da largura útil; conteúdo principal ocupa o restante.
- Fonte sans-serif do sistema; texto-base de 16 px, temperatura de 56 a 64 px e valores secundários de 24 a 32 px.
- Campo com altura mínima de 48 px e botão com área clicável de pelo menos 44 × 44 px.

Usar divisória discreta entre sidebar e indicadores. Evitar elementos decorativos que disputem atenção com os dados. Nomes longos e descrições meteorológicas devem quebrar linha sem corte.

### Responsividade

Abaixo de aproximadamente 640 px, empilhar sidebar e área principal, substituindo a divisória vertical por horizontal. Manter dois indicadores por linha quando houver espaço e uma coluna em telas estreitas. A página deve funcionar a partir de 320 px sem rolagem horizontal.

O estado vazio e o loading ocupam o painel, com conteúdo centralizado e espaço suficiente para manter a composição estável, sem impor uma altura que cause corte no mobile.

### Acessibilidade

- Usar formulário semântico, label associado ao campo e botão com nome acessível “Buscar clima”.
- Garantir foco visível e acionamento por teclado.
- Anunciar carregamento e resultado com região de status, por exemplo `aria-live="polite"`, e indicar `aria-busy` durante a busca.
- Manter contraste mínimo de 4,5:1 para texto comum e não comunicar estado exclusivamente por cor.
- Ocultar ícones decorativos da árvore acessível e respeitar preferência por movimento reduzido nas animações.

## 7. Critérios de aceitação

1. Ao abrir a aplicação, são exibidos o campo e o estado inicial, sem chamadas automáticas à API.
2. Enter e botão acionam o mesmo fluxo; digitar sem enviar não faz requisições.
3. Entrada vazia não chama a API. Nomes com acentos e espaços são codificados corretamente.
4. A geocodificação usa `count=10` e `language=pt`. A consulta meteorológica usa as coordenadas e o timezone da localização selecionada.
5. Uma única localização válida mantém loading contínuo entre as duas requisições. Múltiplas localizações exibem uma lista sem loading e só consultam o clima após a escolha; o painel completo aparece após essa consulta.
6. Cidade não encontrada encerra o fluxo sem consulta meteorológica.
7. Clima ausente, qualquer métrica obrigatória ausente, resposta inválida ou falha de rede apresentam exatamente o mesmo estado sem resultado, sem dados antigos ou parciais.
8. Valores zero e temperaturas negativas são preservados como dados válidos; noite é exibida para `is_day=0`.
9. Sidebar e área principal contêm todas as informações definidas neste PRD, com números em pt-BR e unidades correspondentes.
10. Dia atual usa o timezone da cidade mesmo quando o dispositivo está em outro fuso. Dia/noite acompanha `is_day`.
11. Os códigos listados têm descrições em português; códigos numéricos desconhecidos usam descrição e ícone neutros.
12. Envios repetidos durante loading não iniciam buscas duplicadas; falha ou timeout sempre libera uma nova busca.
13. O painel tem largura máxima de 800 px, fundo branco e cantos arredondados, sobre fundo cinza escuro. Em 320 px não há rolagem horizontal.
14. Busca, feedback e resultados podem ser usados com teclado e compreendidos por leitor de tela.
15. Resultados homônimos são apresentados separadamente, com divisões administrativas disponíveis e coordenadas quando necessário. Selecionar uma opção consulta exclusivamente suas coordenadas; nova busca substitui as opções anteriores.
16. O acesso HTTP ao Open-Meteo está concentrado no serviço e `npm run build` conclui sem erros.

## 8. Verificação da implementação

Validar manualmente uma consulta completa, cidade inexistente, envio vazio, falha de rede, uso por teclado e layout desktop/mobile. Usar respostas controladas com zero, uma e múltiplas localizações, incluindo homônimas com mesmo estado e país, entradas inválidas misturadas às válidas e nova busca durante a etapa de seleção. Usar respostas controladas para verificar métricas ausentes, unidades ausentes, valores zero, códigos desconhecidos, timezone diferente do dispositivo e timeout, sem depender da ocorrência desses cenários na API real.

Priorizar testes unitários das validações do serviço, da composição das duas chamadas e do mapeamento meteorológico. Conferir em uma consulta real se o contrato da API segue compatível antes da entrega da aplicação. Este PRD não representa implementação nem testes executados do aplicativo.

## 9. Referências

- [Brain dump do projeto](./brain-dump.md).
- [Open-Meteo — geocodificação](https://open-meteo.com/en/docs/geocoding-api).
- [Open-Meteo — condições atuais e códigos meteorológicos](https://open-meteo.com/en/docs).

As decisões de idioma, acionamento da busca e tratamento de dados incompletos foram confirmadas pelo responsável pelo projeto. Não há pendências funcionais bloqueantes para a primeira versão descrita aqui.
