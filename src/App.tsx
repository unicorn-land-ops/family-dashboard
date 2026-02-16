import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { CalendarPanel } from './components/calendar/CalendarPanel';
import { ContentRotator } from './components/sidebar/ContentRotator';
import { TransitPanel } from './components/sidebar/TransitPanel';
import { HoroscopePanel } from './components/sidebar/HoroscopePanel';
import { CountryPanel } from './components/sidebar/CountryPanel';
import { RotationIndicator } from './components/sidebar/RotationIndicator';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useContentRotation } from './hooks/useContentRotation';

function App() {
  useAutoRefresh();
  const { activeIndex, goTo, panelCount } = useContentRotation();

  return (
    <DashboardShell>
      <Header />

      {/* Main content area — calendar */}
      <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
        <CalendarPanel />
      </div>

      {/* Sidebar — rotating content panels (hidden in portrait) */}
      <div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
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

      <StatusBar />
    </DashboardShell>
  );
}

export default App;
