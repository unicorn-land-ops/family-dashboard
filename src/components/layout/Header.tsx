import { Clock } from '../clock/Clock';
import { DateDisplay } from '../clock/DateDisplay';

export function Header() {
  return (
    <header className="grid-area-header flex items-center justify-between px-[clamp(8px,1vw,16px)]">
      <div>
        <Clock />
        <DateDisplay />
      </div>
    </header>
  );
}
