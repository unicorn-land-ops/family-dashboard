import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { MobileNav } from './components/layout/MobileNav';
import { CalendarPanel } from './components/calendar/CalendarPanel';
import { GroceryPanel } from './components/grocery/GroceryPanel';
import { TimerPanel } from './components/timer/TimerPanel';
import { useTimers } from './hooks/useTimers';
import { ContentRotator } from './components/sidebar/ContentRotator';
import { TransitPanel } from './components/sidebar/TransitPanel';
import { HoroscopePanel } from './components/sidebar/HoroscopePanel';
import { CountryPanel } from './components/sidebar/CountryPanel';
import { RotationIndicator } from './components/sidebar/RotationIndicator';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useContentRotation } from './hooks/useContentRotation';
import { useGroceries } from './hooks/useGroceries';
import { useMobileNav } from './hooks/useMobileNav';
import { usePriorityInterrupt } from './hooks/usePriorityInterrupt';

function App() {
  useAutoRefresh();
  const { uncheckedCount } = useGroceries();
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length, uncheckedCount);
  const { activeIndex, goTo, panelCount } = useContentRotation(priority.rotationPaused);
  const { activeView, setActiveView } = useMobileNav();

  return (
    <DashboardShell>
      <Header />

      {/* Main content area — switches between calendar and groceries on mobile */}
      <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
        {activeView === 'calendar' && <CalendarPanel />}
        {activeView === 'groceries' && <GroceryPanel variant="full" />}
        {activeView === 'timers' && <TimerPanel variant="full" />}
      </div>

      {/* Sidebar — priority interrupt or rotating content (hidden in portrait) */}
      <div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
        {priority.mode === 'priority' ? (
          <div className="sidebar-priority-enter flex flex-col gap-[clamp(10px,1vw,20px)] flex-1">
            {priority.showTimers && <TimerPanel variant="compact" />}
            {priority.showGroceries && <GroceryPanel variant="compact" />}
          </div>
        ) : (
          <div className="sidebar-rotation-enter flex flex-col gap-[clamp(10px,1vw,20px)] flex-1">
            <ContentRotator activeIndex={activeIndex}>
              <TransitPanel />
              <HoroscopePanel />
              <CountryPanel />
            </ContentRotator>
            <RotationIndicator
              activeIndex={activeIndex}
              panelCount={panelCount}
              labels={['Transit', 'Horoscopes', 'Country']}
              onSelect={goTo}
            />
          </div>
        )}
      </div>

      <StatusBar />
      <MobileNav activeView={activeView} onNavigate={setActiveView} />
    </DashboardShell>
  );
}

export default App;
