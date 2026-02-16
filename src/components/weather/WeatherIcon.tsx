import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiFog,
  WiSprinkle,
  WiRain,
  WiRainWind,
  WiRainMix,
  WiSnow,
  WiShowers,
  WiThunderstorm,
  WiStormShowers,
  WiNa,
  WiSunrise,
  WiSunset,
} from 'react-icons/wi';
import type { IconType } from 'react-icons';
import { getWeatherInfo } from '../../lib/utils/weatherCodes';

const ICON_MAP: Record<string, IconType> = {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiFog,
  WiSprinkle,
  WiRain,
  WiRainWind,
  WiRainMix,
  WiSnow,
  WiShowers,
  WiThunderstorm,
  WiStormShowers,
  WiNa,
  WiSunrise,
  WiSunset,
};

interface WeatherIconProps {
  code: number;
  className?: string;
  size?: string;
}

export function WeatherIcon({ code, className, size }: WeatherIconProps) {
  const { icon } = getWeatherInfo(code);
  const IconComponent = ICON_MAP[icon] ?? WiNa;
  return <IconComponent className={className} size={size} />;
}
