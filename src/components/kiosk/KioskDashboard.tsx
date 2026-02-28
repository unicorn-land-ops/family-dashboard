import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '../layout/Header';
import { StatusBar } from '../layout/StatusBar';
import { KioskTodayCard } from './KioskTodayCard';
import { KioskNextDayCard } from './KioskNextDayCard';
import { KioskCompactRow } from './KioskCompactRow';
import { KioskBottomSection } from './KioskBottomSection';
import { PanelFallback, GlobalFallback, logError } from '../ErrorFallback';
import { useCalendar } from '../../hooks/useCalendar';
import { useWeather } from '../../hooks/useWeather';
function getDailyWeather(weather: ReturnType<typeof useWeather>['data'], dayIndex: number) {
  if (!weather?.daily || dayIndex >= weather.daily.time.length) return null;
  return {
    high: weather.daily.temperature_2m_max[dayIndex],
    low: weather.daily.temperature_2m_min[dayIndex],
    weatherCode: weather.daily.weather_code[dayIndex],
  };
}

export function KioskDashboard() {
  const { days } = useCalendar();
  const { data: weather } = useWeather();
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

        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <KioskBottomSection
            pageA={
              <div style={{ color: 'var(--fd-text-2)', opacity: 0.5, fontStyle: 'italic', padding: '1rem' }}>
                Life Stuff — coming in Plan 02
              </div>
            }
            pageB={
              <div style={{ color: 'var(--fd-text-2)', opacity: 0.5, fontStyle: 'italic', padding: '1rem' }}>
                World Stuff — coming in Plan 02
              </div>
            }
          />
        </ErrorBoundary>

        <div className="kiosk-ticker-area" />

        <StatusBar variant="kiosk" />
        {/* @ts-expect-error Web Component */}
        <unicorn-footer />
      </div>
    </ErrorBoundary>
  );
}
