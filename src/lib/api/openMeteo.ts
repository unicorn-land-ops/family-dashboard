const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.419;
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const BERLIN_TIMEZONE = 'Europe/Berlin';

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

interface WeatherRequest {
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function fetchWeatherForLocation({
  latitude,
  longitude,
  timezone,
}: WeatherRequest): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
    timezone,
    forecast_days: '7',
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchWeather(): Promise<WeatherResponse> {
  return fetchWeatherForLocation({
    latitude: BERLIN_LAT,
    longitude: BERLIN_LON,
    timezone: BERLIN_TIMEZONE,
  });
}
