import { Clock } from '../clock/Clock';
import { DateDisplay } from '../clock/DateDisplay';
import { CurrentWeather } from '../weather/CurrentWeather';
import { SunTimes } from '../weather/SunTimes';

export function Header() {
  return (
    <header className="grid-area-header flex items-center justify-between px-[clamp(8px,1vw,16px)]">
      <div>
        <Clock />
        <DateDisplay />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <CurrentWeather />
        <SunTimes />
      </div>
    </header>
  );
}
