import { IoCalendarOutline, IoCartOutline, IoCheckmarkDoneCircleOutline } from 'react-icons/io5';
import type { MobileView } from '../../hooks/useMobileNav';

interface MobileNavProps {
  activeView: MobileView;
  onNavigate: (view: MobileView) => void;
}

const tabs: { view: MobileView; label: string; icon: typeof IoCalendarOutline }[] = [
  { view: 'calendar', label: 'Calendar', icon: IoCalendarOutline },
  { view: 'groceries', label: 'Groceries', icon: IoCartOutline },
  { view: 'chores', label: 'Chores', icon: IoCheckmarkDoneCircleOutline },
];

export function MobileNav({ activeView, onNavigate }: MobileNavProps) {
  return (
    <div className="grid-area-nav flex backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--fd-bg-1) 80%, transparent)', borderTop: '1px solid var(--fd-card-border)' }}>
      {tabs.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          onClick={() => onNavigate(view)}
          className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px]"
          style={{ color: activeView === view ? 'var(--fd-accent)' : 'var(--fd-text-2)' }}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs mt-1">{label}</span>
        </button>
      ))}
    </div>
  );
}
