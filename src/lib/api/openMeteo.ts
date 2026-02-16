const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.419;
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
}

export async function fetchWeather(): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: String(BERLIN_LAT),
    longitude: String(BERLIN_LON),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
    timezone: 'Europe/Berlin',
    forecast_days: '7',
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
