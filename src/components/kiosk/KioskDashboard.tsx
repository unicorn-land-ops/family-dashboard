import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '../layout/Header';
import { StatusBar } from '../layout/StatusBar';
import { KioskTodayCard } from './KioskTodayCard';
import { KioskNextDayCard } from './KioskNextDayCard';
import { KioskCompactRow } from './KioskCompactRow';
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
import { useCalendar } from '../../hooks/useCalendar';
import { useWeather } from '../../hooks/useWeather';
import { useTimeOfDay } from '../../hooks/useTimeOfDay';

function getDailyWeather(weather: ReturnType<typeof useWeather>['data'], dayIndex: number) {
  if (!weather?.daily || dayIndex >= weather.daily.time.length) return null;
  return {
    high: weather.daily.temperature_2m_max[dayIndex],
    low: weather.daily.temperature_2m_min[dayIndex],
    weatherCode: weather.daily.weather_code[dayIndex],
  };
}

export function KioskDashboard() {
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length);
  const { activeIndex, goTo, panelCount } = useContentRotation(priority.rotationPaused);
  const { days } = useCalendar();
  const { data: weather } = useWeather();
  const phase = useTimeOfDay();

  useEffect(() => {
    document.documentElement.setAttribute('data-phase', phase);
    return () => document.documentElement.removeAttribute('data-phase');
  }, [phase]);

  const todayDay = days[0];
  const tomorrowDay = days[1];
  const dayAfterDay = days[2];
  const compactDays = days.slice(3, 7);
  const compactWeather = compactDays.map((_, i) => getDailyWeather(weather, i + 3));

  return (
    <ErrorBoundary FallbackComponent={GlobalFallback} onError={logError}>
      <div className="kiosk-grid h-dvh w-screen overflow-hidden p-[clamp(14px,1.5vw,24px)] gap-[clamp(10px,1vw,18px)]">
        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <Header variant="kiosk" />
        </ErrorBoundary>

        {todayDay && (
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <div style={{ gridArea: 'today', minHeight: 0, overflow: 'hidden' }}>
              <KioskTodayCard day={todayDay} weather={weather} />
            </div>
          </ErrorBoundary>
        )}

        <div className="kiosk-next-row">
          {tomorrowDay && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <KioskNextDayCard
                day={tomorrowDay}
                dailyWeather={getDailyWeather(weather, 1)}
              />
            </ErrorBoundary>
          )}
          {dayAfterDay && (
            <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
              <KioskNextDayCard
                day={dayAfterDay}
                dailyWeather={getDailyWeather(weather, 2)}
              />
            </ErrorBoundary>
          )}
        </div>

        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <div className="kiosk-compact-area">
            <KioskCompactRow days={compactDays} dailyWeather={compactWeather} />
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
