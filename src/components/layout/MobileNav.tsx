import { IoCalendarOutline, IoCartOutline, IoTimerOutline, IoCheckmarkDoneCircleOutline } from 'react-icons/io5';
import type { MobileView } from '../../hooks/useMobileNav';

interface MobileNavProps {
  activeView: MobileView;
  onNavigate: (view: MobileView) => void;
}

const tabs: { view: MobileView; label: string; icon: typeof IoCalendarOutline }[] = [
  { view: 'calendar', label: 'Calendar', icon: IoCalendarOutline },
  { view: 'groceries', label: 'Groceries', icon: IoCartOutline },
  { view: 'timers', label: 'Timers', icon: IoTimerOutline },
  { view: 'chores', label: 'Chores', icon: IoCheckmarkDoneCircleOutline },
];

export function MobileNav({ activeView, onNavigate }: MobileNavProps) {
  return (
    <div className="grid-area-nav flex bg-bg-primary/80 backdrop-blur-sm border-t border-white/10">
      {tabs.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          onClick={() => onNavigate(view)}
          className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] ${
            activeView === view ? 'text-accent-gold' : 'text-white/40'
          }`}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs mt-1">{label}</span>
        </button>
      ))}
    </div>
  );
}
