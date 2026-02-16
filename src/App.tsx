import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { MobileNav } from './components/layout/MobileNav';
import { CalendarPanel } from './components/calendar/CalendarPanel';
import { GroceryPanel } from './components/grocery/GroceryPanel';
import { ContentRotator } from './components/sidebar/ContentRotator';
import { TransitPanel } from './components/sidebar/TransitPanel';
import { HoroscopePanel } from './components/sidebar/HoroscopePanel';
import { CountryPanel } from './components/sidebar/CountryPanel';
import { RotationIndicator } from './components/sidebar/RotationIndicator';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useContentRotation } from './hooks/useContentRotation';
import { useGroceries } from './hooks/useGroceries';
import { useMobileNav } from './hooks/useMobileNav';

function App() {
  useAutoRefresh();
  const { activeIndex, goTo, panelCount } = useContentRotation();
  const { uncheckedCount } = useGroceries();
  const { activeView, setActiveView } = useMobileNav();

  return (
    <DashboardShell>
      <Header />

      {/* Main content area — switches between calendar and groceries on mobile */}
      <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
        {activeView === 'calendar' && <CalendarPanel />}
        {activeView === 'groceries' && <GroceryPanel variant="full" />}
      </div>

      {/* Sidebar — rotating content panels (hidden in portrait) */}
      <div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
        {uncheckedCount > 0 && <GroceryPanel variant="compact" />}
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
      <MobileNav activeView={activeView} onNavigate={setActiveView} />
    </DashboardShell>
  );
}

export default App;
