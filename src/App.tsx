import { ErrorBoundary } from 'react-error-boundary';
import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { MobileNav } from './components/layout/MobileNav';
import { CalendarPanel } from './components/calendar/CalendarPanel';
import { GroceryPanel } from './components/grocery/GroceryPanel';
import { TimerPanel } from './components/timer/TimerPanel';
import { ChorePanel } from './components/chore/ChorePanel';
import { useTimers } from './hooks/useTimers';
import { ContentRotator } from './components/sidebar/ContentRotator';
import { TransitPanel } from './components/sidebar/TransitPanel';
import { HoroscopePanel } from './components/sidebar/HoroscopePanel';
import { CountryPanel } from './components/sidebar/CountryPanel';
import { RotationIndicator } from './components/sidebar/RotationIndicator';
import { PanelFallback, GlobalFallback, logError } from './components/ErrorFallback';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useMemoryWatchdog } from './hooks/useMemoryWatchdog';
import { useContentRotation } from './hooks/useContentRotation';
import { useGroceries } from './hooks/useGroceries';
import { useMobileNav } from './hooks/useMobileNav';
import { usePriorityInterrupt } from './hooks/usePriorityInterrupt';

function App() {
  useAutoRefresh();
  useMemoryWatchdog();
  const { uncheckedCount } = useGroceries();
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length, uncheckedCount);
  const { activeIndex, goTo, panelCount } = useContentRotation(priority.rotationPaused);
  const { activeView, setActiveView } = useMobileNav();

  return (
    <ErrorBoundary FallbackComponent={GlobalFallback} onError={logError}>
      <DashboardShell>
        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <Header />
        </ErrorBoundary>

        {/* Main content area — switches between calendar and groceries on mobile */}
        <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
          {activeView === 'calendar' && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <CalendarPanel />
            </ErrorBoundary>
          )}
          {activeView === 'groceries' && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <GroceryPanel variant="full" />
            </ErrorBoundary>
          )}
          {activeView === 'timers' && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <TimerPanel variant="full" />
            </ErrorBoundary>
          )}
          {activeView === 'chores' && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <ChorePanel variant="full" />
            </ErrorBoundary>
          )}
        </div>

        {/* Sidebar — priority interrupt or rotating content (hidden in portrait) */}
        <div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
          {priority.mode === 'priority' ? (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <div className="sidebar-priority-enter flex flex-col gap-[clamp(10px,1vw,20px)] flex-1">
                {priority.showTimers && <TimerPanel variant="compact" />}
                {priority.showGroceries && <GroceryPanel variant="compact" />}
              </div>
            </ErrorBoundary>
          ) : (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
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
            </ErrorBoundary>
          )}
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <ChorePanel variant="compact" />
          </ErrorBoundary>
        </div>

        <StatusBar />
        <MobileNav activeView={activeView} onNavigate={setActiveView} />
      </DashboardShell>
    </ErrorBoundary>
  );
}

export default App;
