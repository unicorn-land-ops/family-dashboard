export interface CalendarEvent {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  persons: string[];
  location?: string;
  isSchulfrei?: boolean;
}

export interface DaySchedule {
  date: Date;
  dateStr: string; // 'YYYY-MM-DD'
  events: CalendarEvent[];
  weather?: {
    high: number;
    low: number;
    weatherCode: number;
  };
}

export interface PersonConfig {
  id: string;
  name: string;
  emoji: string;
  calendarUrl: string;
  isWorkCalendar?: boolean;
  travelTimezone?: string;
}
