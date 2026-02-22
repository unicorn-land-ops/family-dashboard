import { Clock } from '../clock/Clock';
import { DateDisplay } from '../clock/DateDisplay';
import { CurrentWeather } from '../weather/CurrentWeather';
import { SunTimes } from '../weather/SunTimes';
import { useTravelTarget } from '../../hooks/useTravelTarget';

interface HeaderProps {
  variant?: 'default' | 'kiosk';
}

export function Header({ variant = 'default' }: HeaderProps) {
  const travelTarget = useTravelTarget();

  return (
    <header
      className={`grid-area-header flex items-center justify-between px-[clamp(8px,1vw,16px)] ${
        variant === 'kiosk' ? 'kiosk-header' : ''
      }`}
    >
      <div>
        <Clock travelTarget={travelTarget} variant={variant} />
        <DateDisplay variant={variant} />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <CurrentWeather travelTarget={travelTarget} variant={variant} />
        <SunTimes variant={variant} />
      </div>
    </header>
  );
}
