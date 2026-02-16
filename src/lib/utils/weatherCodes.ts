export interface WeatherInfo {
  description: string;
  icon: string;
}

/** Complete WMO weather code mapping (codes 0-99) */
export const WMO_CODES: Record<number, WeatherInfo> = {
  0: { description: 'Clear sky', icon: 'WiDaySunny' },
  1: { description: 'Mainly clear', icon: 'WiDaySunny' },
  2: { description: 'Partly cloudy', icon: 'WiDayCloudy' },
  3: { description: 'Overcast', icon: 'WiCloudy' },
  45: { description: 'Fog', icon: 'WiFog' },
  48: { description: 'Depositing rime fog', icon: 'WiFog' },
  51: { description: 'Light drizzle', icon: 'WiSprinkle' },
  53: { description: 'Moderate drizzle', icon: 'WiSprinkle' },
  55: { description: 'Dense drizzle', icon: 'WiRain' },
  56: { description: 'Light freezing drizzle', icon: 'WiRainMix' },
  57: { description: 'Dense freezing drizzle', icon: 'WiRainMix' },
  61: { description: 'Light rain', icon: 'WiRain' },
  63: { description: 'Moderate rain', icon: 'WiRain' },
  65: { description: 'Heavy rain', icon: 'WiRainWind' },
  66: { description: 'Light freezing rain', icon: 'WiRainMix' },
  67: { description: 'Heavy freezing rain', icon: 'WiRainMix' },
  71: { description: 'Light snow', icon: 'WiSnow' },
  73: { description: 'Moderate snow', icon: 'WiSnow' },
  75: { description: 'Heavy snow', icon: 'WiSnow' },
  77: { description: 'Snow grains', icon: 'WiSnow' },
  80: { description: 'Light rain showers', icon: 'WiShowers' },
  81: { description: 'Moderate rain showers', icon: 'WiShowers' },
  82: { description: 'Violent rain showers', icon: 'WiRainWind' },
  85: { description: 'Light snow showers', icon: 'WiSnow' },
  86: { description: 'Heavy snow showers', icon: 'WiSnow' },
  95: { description: 'Thunderstorm', icon: 'WiThunderstorm' },
  96: { description: 'Thunderstorm with light hail', icon: 'WiStormShowers' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'WiStormShowers' },
};

/** Look up weather info by WMO code. Falls back to Unknown for unmapped codes. */
export function getWeatherInfo(code: number): WeatherInfo {
  return WMO_CODES[code] ?? { description: 'Unknown', icon: 'WiNa' };
}
