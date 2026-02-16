import { useCalendar } from '../../hooks/useCalendar';
import { DayRow } from './DayRow';

export function CalendarPanel() {
  const { days, isLoading, isError, errors } = useCalendar();

  if (isLoading) {
    return (
      <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex flex-col gap-3 animate-pulse">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
            <div className="h-8 w-full rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  if (isError && days.every((d) => d.events.length === 0)) {
    return (
      <div className="card-glass p-[clamp(16px,2vw,32px)] flex-1 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="text-lg mb-1">Calendar unavailable</p>
          <p className="text-sm opacity-70">
            {errors.length > 0 && errors[0]?.message?.includes('CORS_PROXY_URL')
              ? 'CORS proxy not configured. Set VITE_CORS_PROXY_URL in .env'
              : 'Unable to load calendar feeds. Will retry automatically.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 overflow-y-auto scrollbar-hide">
      {days.map((day, index) => (
        <DayRow key={day.dateStr} day={day} dayIndex={index} />
      ))}
    </div>
  );
}
