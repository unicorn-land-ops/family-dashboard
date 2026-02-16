import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { CalendarPanel } from './components/calendar/CalendarPanel';
import { useAutoRefresh } from './hooks/useAutoRefresh';

function App() {
  useAutoRefresh();

  return (
    <DashboardShell>
      <Header />

      {/* Main content area — calendar */}
      <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
        <CalendarPanel />
      </div>

      {/* Sidebar — placeholder cards (hidden in portrait) */}
      <div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
        <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex items-center justify-center">
          <span className="text-text-secondary text-lg">Transit</span>
        </div>
        <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex items-center justify-center">
          <span className="text-text-secondary text-lg">Horoscopes</span>
        </div>
      </div>

      <StatusBar />
    </DashboardShell>
  );
}

export default App;
