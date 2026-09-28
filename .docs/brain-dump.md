# Projeto: Clima
Este projeto vai pegar a cidade e baseado nisso, consultar o clima daquela região, exibindo as principais informações de clima, temperatura, humidade e etc.

### Aspectos técnicos
O projeto vai ser feito em Vite + Valilla + Typescript.

### Informações da API que será usada no projeto
Ele vai usar a API OpenMeteu, com os seguintes endpoints:

#### Para pegar a latitude, longitude e timezone, baseado no nome da cidade:
https://geocoding-api.open-meteo.com/v1/search?name={NOME_DA_CIDADE}&count=1&language=en&format=json

{NOME_DA_CIDADE} = É o nome da cidade que o usuário digitou

Exemplo de resposata:

{
  "results": [
    {
      "id": 3385736,
      "name": "Upanema",
      "latitude": -5.64194,
      "longitude": -37.25778,
      "elevation": 46,
      "feature_code": "PPL",
      "country_code": "BR",
      "admin1_id": 3390290,
      "admin2_id": 6320254,
      "timezone": "America/Fortaleza",
      "population": 13577,
      "country_id": 3469034,
      "country": "Brazil",
      "admin1": "Rio Grande do Norte",
      "admin2": "Upanema"
    }
  ],
  "generationtime_ms": 0.5732775
}

Informações que PRECISAMOS:
- name
- latitude
- longitude
- country_code
- timezone

#### Para pegar as informações de clima:
https://api.open-meteo.com/v1/forecast?latitude=-5.64194&longitude=-37.25778&current=relative_humidity_2m,temperature_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code&timezone=America%2FSao_Paulo

{LATITUDE} = Latitude
{LOGITUDE} = Longitude
{TIMEZONE} = Timezone

Exemplode resposta:

{
  "latitude": -5.6590505,
  "longitude": -37.22589,
  "generationtime_ms": 0.154495239257813,
  "utc_offset_seconds": -10800,
  "timezone": "America/Sao_Paulo",
  "timezone_abbreviation": "GMT-3",
  "elevation": 48,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "relative_humidity_2m": "%",
    "temperature_2m": "°C",
    "apparent_temperature": "°C",
    "is_day": "",
    "wind_speed_10m": "km/h",
    "wind_direction_10m": "°",
    "precipitation_probability": "%",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-09-26T17:15",
    "interval": 900,
    "relative_humidity_2m": 27,
    "temperature_2m": 35.9,
    "apparent_temperature": 35.3,
    "is_day": 1,
    "wind_speed_10m": 12.5,
    "wind_direction_10m": 69,
    "precipitation_probability": 0,
    "weather_code": 0
  }
}

Informações que precisamos:
na resposta eu tenho 2 itens:
- current_units tem as unidades de medida das propriedades
- current tem os valores das propriedades

Propriedades obrigatóreas:
- temperature_2m
- apparent_temperature
- relative_humidity_2m
- is_day
- wind_speed_10m
- wind_speed_10m
- precipitation_probability
- 



#### Informação importante:
Teremos um arquivo com as funções do OpenMeteo, para que o projeto não faça requisição direta a API, mas sim use as funcões do arquivo.

Fluxo e pesquisa para receber o nome da cidade e pegar as informações de clima:
- O usuário digita o nome da cidade
- O projeto pega o nome e usa o OpenMeteo para pegar a latitude, longitude e timezone
- Ao pegar latitude, longitude e timezone, o projeto usa essas informações para fazer a requisição e pegar as informações do cliema dessa localização.
- Caso não ache as informações da cidade, se comportar como se não tivesse achado nada
- Caso ache as informações da cidade, mas não as de clime, se comportar como se não tivesse achado nada.

A busca envolve as 2 requisições (buscar latitude/longitude/timezone + buscar clima), mas para o usuário é só uma, com loading.

As funções do OpenMeteo devem verificar se os parâmetros vieram, caso contrário, age como se não tivesse vindo.

### Aspectos visuais (design/UX)

Tem que ter Empty State.
Teremos uma área SUPERIOR contralizada que tem aonas o campo de busca da cidade.
O projeto terá uma side bar na esquera com as seguintes informações:
- Temperatura
- Nome da cidade, Código do país
- Dia atual
- Se é dia/noite (baseado no is_day)
- Weather code


Na área principal:
- Humidade relativa
- Temperau aparente
- Probabilidade de precipitação 
- Velocidade/Direção do vento


Design geral:
- O projeto terá um fundo cinza escuro
- a parte superior não terá background, mas tanto sidebar, quanto a área principal ficarão dentro de uma div com borda bem arredondada, fundo branco, centralizada e largura máxima de 800px. 


Informações de interpretação sobre o Weader code:

WMO Weather interpretation codes (WW)
Code	Description
0	Clear sky
1	Mainly clear
2	Partly cloudy
3	Overcast
45	Fog
48	Depositing rime fog
51	Light drizzle
53	Moderate drizzle
55	Dense drizzle
56	Light freezing drizzle
57	Dense freezing drizzle
61	Slight rain
63	Moderate rain
65	Heavy rain
66	Light freezing rain
67	Heavy freezing rain
71	Slight snowfall
73	Moderate snowfall
75	Heavy snowfall
77	Snow grains
80	Slight rain showers
81	Moderate rain showers
82	Violent rain showers
85	Slight snow showers
86	Heavy snow showers
95	Thunderstorm
96	Thunderstorm with slight hail *
97	Heavy thunderstorm
99	Thunderstorm with heavy hail *
(*) Codes 96 and 99 are only reported by models with an explicit hail forecast, such as DWD ICON or UKMO. All other models derive thunderstorms from instability parameters and report codes 95 and 97.

