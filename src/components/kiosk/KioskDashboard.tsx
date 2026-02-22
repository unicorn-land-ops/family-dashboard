import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '../layout/Header';
import { StatusBar } from '../layout/StatusBar';
import { KioskWeekGrid } from './KioskWeekGrid';
import { TimerPanel } from '../timer/TimerPanel';
import { ContentRotator } from '../sidebar/ContentRotator';
import { TransitPanel } from '../sidebar/TransitPanel';
import { HoroscopePanel } from '../sidebar/HoroscopePanel';
import { CountryPanel } from '../sidebar/CountryPanel';
import { RotationIndicator } from '../sidebar/RotationIndicator';
import { GroceryPanel } from '../grocery/GroceryPanel';
import { ChorePanel } from '../chore/ChorePanel';
import { PanelFallback, GlobalFallback, logError } from '../ErrorFallback';
import { useTimers } from '../../hooks/useTimers';
import { usePriorityInterrupt } from '../../hooks/usePriorityInterrupt';
import { useContentRotation } from '../../hooks/useContentRotation';

export function KioskDashboard() {
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length);
  const { activeIndex, goTo, panelCount } = useContentRotation(priority.rotationPaused);

  return (
    <ErrorBoundary FallbackComponent={GlobalFallback} onError={logError}>
      <div className="kiosk-grid h-dvh w-screen overflow-hidden p-[clamp(14px,1.5vw,24px)] gap-[clamp(10px,1vw,18px)]">
        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <Header variant="kiosk" />
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <div className="kiosk-main">
            <KioskWeekGrid />
          </div>
        </ErrorBoundary>

        <div className="kiosk-utility-row">
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <div className="kiosk-utility-primary">
              {priority.mode === 'priority' ? (
                <TimerPanel variant="compact" />
              ) : (
                <div className="flex flex-col h-full">
                  <ContentRotator activeIndex={activeIndex}>
                    <TransitPanel />
                    <HoroscopePanel />
                    <CountryPanel />
                  </ContentRotator>
                  <div className="pointer-events-none">
                    <RotationIndicator
                      activeIndex={activeIndex}
                      panelCount={panelCount}
                      labels={['Transit', 'Horoscopes', 'Country']}
                      onSelect={goTo}
                    />
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>

          <div className="kiosk-utility-secondary">
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <GroceryPanel variant="compact" />
            </ErrorBoundary>
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <ChorePanel variant="compact" />
            </ErrorBoundary>
          </div>
        </div>

        <StatusBar variant="kiosk" />
      </div>
    </ErrorBoundary>
  );
}
