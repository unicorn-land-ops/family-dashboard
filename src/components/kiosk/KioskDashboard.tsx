import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { formatInTimeZone } from 'date-fns-tz';
import './kioskD.css';
import { StatusBar } from '../layout/StatusBar';
import { KioskPhotoFrame } from './KioskPhotoFrame';
import { KioskDial, EMOJI, personOf, minutesOf, type DialTimer } from './KioskDial';
import { KioskIcon, choreIcon } from './KioskIcon';
import { WeatherIcon } from '../weather/WeatherIcon';
import { PanelFallback, GlobalFallback, logError } from '../ErrorFallback';
import { useCalendar } from '../../hooks/useCalendar';
import { useWeather } from '../../hooks/useWeather';
import { useTimers, getRemainingSeconds, formatCountdown } from '../../hooks/useTimers';
import { useTransit } from '../../hooks/useTransit';
import { useChores } from '../../hooks/useChores';
import { useEvents } from '../../hooks/useEvents';
import { useNewsTicker } from '../../hooks/useNewsTicker';
import { isChoreCompleted } from '../../lib/choreSchedule';
import { activeReminders } from '../../lib/reminders';
import { COUNTDOWN_EVENTS, getUpcomingCountdowns, eventRowToCountdown } from '../../lib/countdowns';
import { getWeatherInfo } from '../../lib/utils/weatherCodes';
import { TIMEZONE } from '../../lib/utils/timeFormat';
import { addDaysIso, bedtime, holidayName, isWeekendMode, kitFor, u2Disruption, wear, type Kid } from '../../lib/familyRules';
import type { CalendarEvent, DaySchedule } from '../../lib/calendar/types';
import type { Chore, ChoreCompletion } from '../../types/database';

const TIMER_COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)'];
const KID_NAME: Record<Kid, string> = { wren: 'Wren', ellis: 'Ellis' };
const hm = (d: Date) => formatInTimeZone(d, TIMEZONE, 'HH:mm');
const isWork = (e: CalendarEvent) => e.persons.some((p) => p.endsWith('-work'));
const LEAD_EMOJI = /^(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)\s*/u;
/** '🛏️ Make Bed' → ['🛏️', 'Make Bed'] */
const splitEmoji = (t: string): [string | null, string] => { const m = t.match(LEAD_EMOJI); return m ? [m[1], t.slice(m[0].length)] : [null, t]; };

/** Ticks every second only while a timer runs; otherwise every 10 s is plenty for an HH:mm clock. */
function useNow(fast: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), fast ? 1000 : 10_000);
    return () => clearInterval(id);
  }, [fast]);
  return now;
}

/** Scale the 1080×1920 design to whatever window it lands in (1:1 on the kiosk). */
function useFit() {
  const calc = () => Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
  const [s, setS] = useState(calc);
  useEffect(() => {
    const on = () => setS(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return s;
}

function inMinutes(nowHm: string, at: string) {
  const d = minutesOf(at) - minutesOf(nowHm);
  if (d <= 0) return null;
  return d < 60 ? `in ${d} Min` : `in ${Math.floor(d / 60)} h ${String(d % 60).padStart(2, '0')}`;
}

function Wear({ temp, rain, when }: { temp: number; rain: number; when?: string }) {
  return (
    <div className="kd-wear">
      {when && <span className="kd-when">{when}</span>}
      {wear(temp, rain).map((w) => <span key={w.label} role="img" aria-label={w.label}>{w.emoji}</span>)}
    </div>
  );
}

function KitStrip({ iso, events, label, extra }: { iso: string; events: CalendarEvent[]; label: string; extra?: React.ReactNode }) {
  const kit = kitFor(iso, events);
  if (!kit.length && !extra) return null;
  return (
    <div className="kd-strip">
      {kit.length > 0 && <span className="kd-lbl">{label}</span>}
      {kit.map((k) => (
        <span key={k.kid + k.label} className={`kd-chip is-kit is-${k.kid} ${k.kid === 'ellis' ? 'de' : ''}`}>
          {EMOJI[k.kid]} {k.emoji} {k.label}
        </span>
      ))}
      {extra}
    </div>
  );
}

function ChoreBox({ chore, done }: { chore: Chore; done: boolean }) {
  return (
    <div className={done ? 'is-done' : ''}>
      <i className="kd-box">{done && <KioskIcon name="check" />}</i>
      <span>{chore.title}</span>
    </div>
  );
}

function Routine({ chores, completions }: { chores: Chore[]; completions: ChoreCompletion[] }) {
  const wren = chores.filter((c) => c.assigned_to === 'wren');
  const ellis = chores.filter((c) => c.assigned_to === 'ellis');
  const done = (c: Chore) => isChoreCompleted(c, completions);
  const cur = ellis.find((c) => !done(c));
  const rest = ellis.filter((c) => c !== cur);
  if (!wren.length && !ellis.length) return null;
  return (
    <div className="kd-routine">
      <div className="kd-kid is-wren">
        <h3>🌸 Wren</h3>
        <div className="kd-wl">{wren.slice(0, 4).map((c) => <ChoreBox key={c.id} chore={c} done={done(c)} />)}</div>
      </div>
      <div className="kd-kid is-ellis de">
        <h3>🥭 Ellis</h3>
        {cur ? (
          <div className="kd-jetzt">
            {splitEmoji(cur.title)[0] ? <span className="kd-pic is-emoji">{splitEmoji(cur.title)[0]}</span> : <KioskIcon name={choreIcon(cur.title)} className="kd-pic" />}
            <div><div className="kd-small">Jetzt:</div><div className="kd-big">{splitEmoji(cur.title)[1]}</div></div>
          </div>
        ) : (
          <div className="kd-jetzt"><KioskIcon name="star" className="kd-pic" /><div className="kd-big">Alles fertig!</div></div>
        )}
        {rest.length > 0 && (
          <div className="kd-then">Dann: {rest.slice(0, 3).map((c) => (
            <span key={c.id} className={done(c) ? 'is-d' : ''}>{done(c) ? <KioskIcon name="check" /> : splitEmoji(c.title)[0] ?? <KioskIcon name={choreIcon(c.title)} />} {splitEmoji(c.title)[1]}</span>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function DayStrip({ days, weather }: { days: DaySchedule[]; weather: ReturnType<typeof useWeather>['data'] }) {
  return (
    <div className="kd-days">
      {days.map((d) => {
        const iso = d.dateStr;
        const w = weather?.daily;
        const wi = w ? w.time.indexOf(iso) : -1;
        const allDay = d.events.find((e) => e.isAllDay)?.summary ?? holidayName(iso);
        const timed = d.events.filter((e) => !e.isAllDay);
        const shown = timed.length > 3 ? timed.slice(0, 2) : timed;
        return (
          <div key={iso} className="kd-day">
            <div className="kd-hd">
              {formatInTimeZone(d.date, TIMEZONE, 'EEE')}
              {wi >= 0 && <small><WeatherIcon code={w!.weather_code[wi]} size="1.1em" /> {Math.round(w!.temperature_2m_max[wi])}°/{Math.round(w!.temperature_2m_min[wi])}°</small>}
            </div>
            {allDay && <div className="kd-ad">{allDay}</div>}
            {shown.map((e) => (
              <div key={e.id + e.startTime.getTime()} className="kd-e">
                {EMOJI[personOf(e)]} {isWork(e) ? `${hm(e.startTime)} Meeting` : `${hm(e.startTime)} ${e.summary}`}
              </div>
            ))}
            {timed.length > 3 && <div className="kd-more">+{timed.length - 2} more</div>}
            {!allDay && timed.length === 0 && <div className="kd-free">Free</div>}
          </div>
        );
      })}
    </div>
  );
}

function Stage({ now }: { now: Date }) {
  const { events } = useEvents();
  const { headlines } = useNewsTicker();
  const cds = getUpcomingCountdowns([...COUNTDOWN_EVENTS, ...events.map(eventRowToCountdown)], 4);
  const h = headlines.length ? headlines[Math.floor(now.getTime() / 20_000) % headlines.length] : null;
  return (
    <div className="kd-stage kd-grow">
      {cds.length > 0 && (
        <div className="kd-cd">
          {cds.map((c) => (
            <div key={c.id}><b>{c.daysRemaining === 0 ? 'Today' : c.daysRemaining}</b>{c.emoji} {c.label}</div>
          ))}
        </div>
      )}
      {h && <div className="kd-news"><b>{h.source}</b> {h.title}</div>}
    </div>
  );
}

function Photo() {
  return <div className="kd-photo kd-grow"><KioskPhotoFrame /></div>;
}

export function KioskDashboard() {
  const fit = useFit();
  const { days } = useCalendar();
  const { data: weather } = useWeather();
  const { activeTimers, completedTimers } = useTimers();
  const { chores, completions } = useChores();
  const now = useNow(activeTimers.length + completedTimers.length > 0);

  const iso = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
  const tomorrowIso = addDaysIso(iso, 1);
  const nowHm = hm(now);
  const morning = minutesOf(nowHm) < 12 * 60;
  const today = days.find((d) => d.dateStr === iso) ?? days[0];
  const tomorrow = days.find((d) => d.dateStr === tomorrowIso);
  const todayEvents = today?.events ?? [];
  const weekend = isWeekendMode(iso, todayEvents);
  const { data: deps } = useTransit(morning && !weekend);
  const disruption = morning && !weekend && deps ? u2Disruption(deps) : null;

  const daily = weather?.daily;
  const di = daily ? daily.time.indexOf(iso) : -1;
  const ti = daily ? daily.time.indexOf(tomorrowIso) : -1;
  const reminders = activeReminders(now);
  const todayRem = reminders.filter((r) => r.date === iso);
  const tomorrowRem = reminders.filter((r) => r.date === tomorrowIso);
  const dialRem = todayRem.find((r) => r.flashFrom && r.flashTo);

  const timers = [...activeTimers, ...completedTimers].slice(0, 3);
  const dialTimers: DialTimer[] = timers.map((t, i) => ({
    id: t.id,
    fraction: t.duration_seconds ? getRemainingSeconds(t) / t.duration_seconds : 0,
    color: TIMER_COLORS[i],
  }));
  const bedtimes = (['ellis', 'wren'] as Kid[]).map((kid) => ({ kid, at: bedtime(kid, iso, tomorrow?.events) }));
  const holiday = holidayName(iso);

  const centre = () => {
    if (timers.length === 1) {
      const t = timers[0];
      const left = getRemainingSeconds(t);
      return (
        <div className={`kd-t1 ${left === 0 ? 'is-ringing' : ''}`}>
          <div className="kd-tclock">{nowHm}</div>
          <div className="kd-tbig">{formatCountdown(left)}</div>
          <div className="kd-tlbl"><KioskIcon name="timer" /> {t.label}</div>
        </div>
      );
    }
    if (timers.length > 1) {
      return (
        <div className="kd-tn">
          <div className="kd-tclock">{nowHm}</div>
          {timers.map((t, i) => {
            const left = getRemainingSeconds(t);
            return (
              <div key={t.id} className={`kd-trow ${left === 0 ? 'is-ringing' : ''}`}>
                <i style={{ background: TIMER_COLORS[i] }} />
                <span>{t.label}</span>
                <b style={{ color: TIMER_COLORS[i] }}>{formatCountdown(left)}</b>
              </div>
            );
          })}
        </div>
      );
    }
    const w = weather?.current;
    return (
      <>
        <div className="kd-time">{nowHm}</div>
        <div className="kd-date">{formatInTimeZone(now, TIMEZONE, 'EEEE d MMMM')}</div>
        {w && daily && di >= 0 && (
          <div className="kd-wx">
            <span className="kd-wxico"><WeatherIcon code={w.weather_code} size="1em" /></span>
            <b>{Math.round(w.temperature_2m)}°</b>
            <span>{Math.round(daily.temperature_2m_max[di])}° / {Math.round(daily.temperature_2m_min[di])}°<br />{getWeatherInfo(w.weather_code).description}</span>
          </div>
        )}
        {weekend && morning && holiday ? (
          <div className="kd-modechip">{holiday}</div>
        ) : morning && w && daily && di >= 0 ? (
          <Wear temp={w.temperature_2m} rain={daily.precipitation_probability_max?.[di] ?? 0} />
        ) : !morning && daily && ti >= 0 ? (
          <Wear temp={daily.temperature_2m_min[ti]} rain={daily.precipitation_probability_max?.[ti] ?? 0} when="Tomorrow" />
        ) : null}
      </>
    );
  };

  const reminderRow = (r: (typeof reminders)[number], prefix = '') => (
    <div key={r.date + r.text} className={`kd-row ${r.flashing ? 'is-flashing' : ''}`}>
      <KioskIcon name="bell" /><span className="is-wrap">{prefix}{r.text}</span>
    </div>
  );

  const body = () => {
    if (!morning) {
      return (
        <>
          {bedtimes.filter((b) => inMinutes(nowHm, b.at)).map((b) => (
            <div key={b.kid} className={`kd-row ${b.kid === 'ellis' ? 'de' : ''}`}>
              <KioskIcon name="bed" />
              <span>{EMOJI[b.kid]} {b.kid === 'ellis' ? 'Schlafenszeit' : `${KID_NAME[b.kid]}: bedtime`}</span>
              <small>{b.at} · {inMinutes(nowHm, b.at)}</small>
            </div>
          ))}
          {tomorrowRem.map((r) => reminderRow(r, 'Tomorrow: '))}
          {daily && ti >= 0 && (
            <div className="kd-row">
              <span className="kd-rowico"><WeatherIcon code={daily.weather_code[ti]} size="1em" /></span>
              <span>Tomorrow: {Math.round(daily.temperature_2m_max[ti])}° / {Math.round(daily.temperature_2m_min[ti])}°, {getWeatherInfo(daily.weather_code[ti]).description.toLowerCase()}</span>
              {holidayName(tomorrowIso) && <small>{holidayName(tomorrowIso)}</small>}
            </div>
          )}
          <KitStrip iso={tomorrowIso} events={tomorrow?.events ?? []} label="Pack for tomorrow" />
          <Photo />
          <DayStrip days={days.slice(1, 6)} weather={weather} />
        </>
      );
    }
    if (weekend) {
      return (
        <>
          {todayRem.map((r) => reminderRow(r))}
          {todayEvents.filter((e) => e.isAllDay && e.endTime.getTime() - e.startTime.getTime() <= 86_400_000).map((e) => (
            <div key={e.id} className="kd-row"><KioskIcon name="star" /><span>{EMOJI[personOf(e)]} {e.summary}</span><small>today</small></div>
          ))}
          <Routine chores={chores} completions={completions} />
          <Photo />
          <DayStrip days={days.slice(1, 6)} weather={weather} />
        </>
      );
    }
    return (
      <>
        {todayRem.map((r) => reminderRow(r))}
        {disruption && (
          <div className="kd-row is-flashing"><i className="kd-line">U2</i><span className="de"><b>{disruption}</b></span></div>
        )}
        <KitStrip
          iso={iso}
          events={todayEvents}
          label="Today, bring"
          extra={!disruption && deps ? <span className="kd-chip is-ok"><KioskIcon name="train" /> U2 on time</span> : undefined}
        />
        <Routine chores={chores} completions={completions} />
        <DayStrip days={days.slice(1, 6)} weather={weather} />
        <Stage now={now} />
      </>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={GlobalFallback} onError={logError}>
      <div className="kd-viewport">
        <div className="kd" style={{ transform: `scale(${fit})` }}>
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <div className="kd-dialwrap">
              <KioskDial
                now={now}
                events={todayEvents}
                sunrise={di >= 0 ? daily!.sunrise[di].slice(11, 16) : undefined}
                sunset={di >= 0 ? daily!.sunset[di].slice(11, 16) : undefined}
                reminder={dialRem ? { from: dialRem.flashFrom!, to: dialRem.flashTo!, flashing: dialRem.flashing } : undefined}
                timers={dialTimers}
                marks={!morning ? bedtimes.map((b) => ({ time: b.at, emoji: EMOJI[b.kid], color: `var(--p-${b.kid})` })) : []}
              />
            </div>
            <div className="kd-center">{centre()}</div>
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <div className="kd-flow">{body()}</div>
          </ErrorBoundary>
          <div className="kd-status"><StatusBar variant="kiosk" /></div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
