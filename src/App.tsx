import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';

function App() {
  return (
    <DashboardShell>
      <Header />

      {/* Main content area — placeholder cards */}
      <div className="grid-area-main flex flex-col gap-[clamp(10px,1vw,20px)]">
        <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex items-center justify-center">
          <span className="text-text-secondary text-lg">Weather</span>
        </div>
        <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex items-center justify-center">
          <span className="text-text-secondary text-lg">Calendar</span>
        </div>
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
