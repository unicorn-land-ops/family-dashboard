import { Clock } from '../clock/Clock';
import { DateDisplay } from '../clock/DateDisplay';
import { CurrentWeather } from '../weather/CurrentWeather';
import { SunTimes } from '../weather/SunTimes';
import { useTravelTarget } from '../../hooks/useTravelTarget';

export function Header() {
  const travelTarget = useTravelTarget();

  return (
    <header className="grid-area-header flex items-center justify-between px-[clamp(8px,1vw,16px)]">
      <div>
        <Clock travelTarget={travelTarget} />
        <DateDisplay />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <CurrentWeather travelTarget={travelTarget} />
        <SunTimes />
      </div>
    </header>
  );
}
