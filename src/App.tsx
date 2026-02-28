import { useEffect } from 'react';
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
import { useMobileNav } from './hooks/useMobileNav';
import { usePriorityInterrupt } from './hooks/usePriorityInterrupt';
import { useTimeOfDay } from './hooks/useTimeOfDay';
import { KioskDashboard } from './components/kiosk/KioskDashboard';

function DefaultDashboard() {
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length);
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
      {/* @ts-expect-error Web Component */}
      <unicorn-footer />
    </ErrorBoundary>
  );
}

function resolveDashboardView(): 'default' | 'kiosk' {
  const viewParam = new URLSearchParams(window.location.search).get('view');
  return viewParam?.toLowerCase() === 'kiosk' ? 'kiosk' : 'default';
}

function App() {
  useAutoRefresh();
  useMemoryWatchdog();
  const view = resolveDashboardView();
  const phase = useTimeOfDay();

  useEffect(() => {
    document.documentElement.setAttribute('data-phase', phase);
    return () => document.documentElement.removeAttribute('data-phase');
  }, [phase]);

  if (view === 'kiosk') {
    return <KioskDashboard />;
  }

  return <DefaultDashboard />;
}

export default App;
