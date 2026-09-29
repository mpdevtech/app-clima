export type WeatherIcon =
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud-moon'
  | 'cloud'
  | 'fog'
  | 'cloud-drizzle'
  | 'cloud-hail'
  | 'cloud-rain'
  | 'snowflake'
  | 'cloud-snow'
  | 'cloud-lightning'
  | 'cloud-question'

export type WeatherDescription = {
  description: string
  icon: WeatherIcon
}

type WeatherCondition = WeatherDescription & {
  nightIcon?: WeatherIcon
}

const conditions = new Map<number, WeatherCondition>([
  [0, { description: 'Céu limpo', icon: 'sun', nightIcon: 'moon' }],
  [1, { description: 'Predominantemente limpo', icon: 'cloud-sun', nightIcon: 'cloud-moon' }],
  [2, { description: 'Parcialmente nublado', icon: 'cloud-sun', nightIcon: 'cloud-moon' }],
  [3, { description: 'Encoberto', icon: 'cloud' }],
  [45, { description: 'Nevoeiro', icon: 'fog' }],
  [48, { description: 'Nevoeiro com formação de geada', icon: 'fog' }],
  [51, { description: 'Garoa leve', icon: 'cloud-drizzle' }],
  [53, { description: 'Garoa moderada', icon: 'cloud-drizzle' }],
  [55, { description: 'Garoa intensa', icon: 'cloud-drizzle' }],
  [56, { description: 'Garoa congelante leve', icon: 'cloud-hail' }],
  [57, { description: 'Garoa congelante intensa', icon: 'cloud-hail' }],
  [61, { description: 'Chuva leve', icon: 'cloud-rain' }],
  [63, { description: 'Chuva moderada', icon: 'cloud-rain' }],
  [65, { description: 'Chuva forte', icon: 'cloud-rain' }],
  [66, { description: 'Chuva congelante leve', icon: 'cloud-hail' }],
  [67, { description: 'Chuva congelante forte', icon: 'cloud-hail' }],
  [71, { description: 'Neve leve', icon: 'cloud-snow' }],
  [73, { description: 'Neve moderada', icon: 'cloud-snow' }],
  [75, { description: 'Neve forte', icon: 'cloud-snow' }],
  [77, { description: 'Grãos de neve', icon: 'snowflake' }],
  [80, { description: 'Pancadas de chuva leves', icon: 'cloud-rain' }],
  [81, { description: 'Pancadas de chuva moderadas', icon: 'cloud-rain' }],
  [82, { description: 'Pancadas de chuva intensas', icon: 'cloud-rain' }],
  [85, { description: 'Pancadas de neve leves', icon: 'cloud-snow' }],
  [86, { description: 'Pancadas de neve fortes', icon: 'cloud-snow' }],
  [95, { description: 'Trovoada', icon: 'cloud-lightning' }],
  [96, { description: 'Trovoada com granizo leve', icon: 'cloud-lightning' }],
  [97, { description: 'Trovoada forte', icon: 'cloud-lightning' }],
  [99, { description: 'Trovoada com granizo forte', icon: 'cloud-lightning' }],
])

const unknownCondition: WeatherDescription = {
  description: 'Condição meteorológica desconhecida',
  icon: 'cloud-question',
}

export function getWeatherDescription(weatherCode: number, isDay: 0 | 1): WeatherDescription {
  const condition = conditions.get(weatherCode)
  if (!condition) return unknownCondition

  return {
    description: condition.description,
    icon: isDay === 0 && condition.nightIcon ? condition.nightIcon : condition.icon,
  }
}