import { useEffect, useState, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { formatInTimeZone } from 'date-fns-tz';
import './kioskD.css';
import { StatusBar } from '../layout/StatusBar';
import { KioskPhoto } from './KioskPhoto';
import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { PHOTO_WORKER_URL } from '../../config/photos';
import { KioskDial, EMOJI, minutesOf, type DialTimer } from './KioskDial';
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
import { addDaysIso, bedtime, groupMeetings, holidayName, isWeekendMode, kitFor, u2Disruption, wear, type Kid } from '../../lib/familyRules';
import type { CalendarEvent, DaySchedule } from '../../lib/calendar/types';
import type { Chore, ChoreCompletion } from '../../types/database';

/** How long each block of the rotating lower half stays up. Joshua asked for 5 s (15.10.2026). */
export const ROTATE_MS = 5_000;
/** Chores come back with the HomePod (30.10): flip to true and the kids' jobs return, pinned on school mornings. */
export const SHOW_CHORES = false;

const TIMER_COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)'];
const KIDS: { kid: Kid; name: string }[] = [{ kid: 'ellis', name: 'Ellis' }, { kid: 'wren', name: 'Wren' }];
const hm = (d: Date) => formatInTimeZone(d, TIMEZONE, 'HH:mm');
const LEAD_EMOJI = /^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*/u;
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

/** Minutes until a HH:mm later today, or null once it has passed. */
function minutesUntil(nowHm: string, at: string) {
  const d = minutesOf(at) - minutesOf(nowHm);
  return d > 0 ? d : null;
}
const inText = (d: number) => (d < 60 ? `in ${d} min` : `in ${Math.floor(d / 60)} h ${String(d % 60).padStart(2, '0')}`);

function Wear({ temp, rain }: { temp: number; rain: number }) {
  return <>{wear(temp, rain).map((w) => <span key={w.label} role="img" aria-label={w.label}>{w.emoji}</span>)}</>;
}

function KitChips({ iso, events }: { iso: string; events: CalendarEvent[] }) {
  return (
    <>
      {kitFor(iso, events).map((k) => (
        <span key={k.kid + k.label} className={`kd-chip is-${k.kid}`}>{EMOJI[k.kid]} {k.emoji} {k.label}</span>
      ))}
    </>
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
      <div className="kd-kid">
        <h3>🌸 Wren</h3>
        <div className="kd-wl">{wren.slice(0, 4).map((c) => <ChoreBox key={c.id} chore={c} done={done(c)} />)}</div>
      </div>
      <div className="kd-kid de">
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

/** Today and the next two days, each parent's evening meetings folded into one line. */
function Week({ days, weather, todayIso }: { days: DaySchedule[]; weather: ReturnType<typeof useWeather>['data']; todayIso: string }) {
  return (
    <div className="kd-days">
      {days.map((d) => {
        const iso = d.dateStr;
        const w = weather?.daily;
        const wi = w ? w.time.indexOf(iso) : -1;
        const allDay = d.events.find((e) => e.isAllDay)?.summary ?? holidayName(iso);
        const items = groupMeetings(d.events);
        const shown = items.length > 6 ? items.slice(0, 5) : items;
        return (
          <div key={iso} className="kd-day">
            <div className="kd-hd">{d.dateStr === todayIso ? 'Today' : formatInTimeZone(d.date, TIMEZONE, 'EEEE')}<span>{formatInTimeZone(d.date, TIMEZONE, 'd MMM')}</span></div>
            {wi >= 0 && <div className="kd-dwx"><WeatherIcon code={w!.weather_code[wi]} size="1.2em" /> {Math.round(w!.temperature_2m_max[wi])}° / {Math.round(w!.temperature_2m_min[wi])}°</div>}
            {allDay && <div className="kd-ad">{allDay}</div>}
            {shown.map((e) => {
              const [main, sub] = e.title.split(' · ');
              return <div key={e.key} className="kd-e"><span>{EMOJI[e.person]}</span><span>{main}{sub && <small>{sub}</small>}</span></div>;
            })}
            {items.length > 6 && <div className="kd-more">+{items.length - 5} more</div>}
            {!allDay && items.length === 0 && <div className="kd-free">Free</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Feeds hand us titles with HTML entities still in them ("Cal AI&#8217;s"). */
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodeEntities = (t: string) =>
  t.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1].toLowerCase() === 'x' ? 2 : 1), e[1].toLowerCase() === 'x' ? 16 : 10)) : ENTITIES[e.toLowerCase()] ?? m);

function Countdowns({ now }: { now: Date }) {
  const { events } = useEvents();
  const { headlines } = useNewsTicker();
  const cds = getUpcomingCountdowns([...COUNTDOWN_EVENTS, ...events.map(eventRowToCountdown)], 4);
  const h = headlines.length ? headlines[Math.floor(now.getTime() / 20_000) % headlines.length] : null;
  return (
    <div className="kd-block kd-countdowns">
      <div className="kd-cd">
        {cds.map((c) => (
          <div key={c.id}>
            <span className="kd-cdemoji">{c.emoji}</span>
            <b>{c.daysRemaining === 0 ? 'Today' : c.daysRemaining}</b>
            <span>{c.daysRemaining === 0 ? c.label : `${c.daysRemaining === 1 ? 'day' : 'days'} to ${c.label}`}</span>
          </div>
        ))}
      </div>
      {h && <div className="kd-news"><b>{h.source}</b> {decodeEntities(h.title)}</div>}
    </div>
  );
}

/**
 * Blocks crossfade in place. Each block renders with its appearance number: the count of the showing it is
 * on or waiting for, which ticks over right after the block hides, so a photo block can load its next
 * picture while it's out of sight.
 */
function Rotator({ order, blocks }: { order: string[]; blocks: Record<string, (appearance: number) => ReactNode> }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (order.length < 2) return;
    const id = setInterval(() => setI((x) => x + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [order.length]);
  const pos = order.length ? i % order.length : 0;
  const active = order[pos];
  return (
    <div className="kd-rot kd-grow">
      {order.map((id, p) => (
        <div key={id} className={`kd-slide ${id === active ? 'is-on' : ''}`} aria-hidden={id !== active}>
          {blocks[id](Math.max(0, Math.ceil((i - p) / order.length)))}
        </div>
      ))}
      {order.length > 1 && (
        <div className="kd-dots" aria-hidden="true">{order.map((_, j) => <i key={j} className={j === pos ? 'is-on' : ''} />)}</div>
      )}
    </div>
  );
}

export function KioskDashboard() {
  const fit = useFit();
  const { days } = useCalendar();
  const { data: weather } = useWeather();
  const { activeTimers, completedTimers } = useTimers();
  const { chores, completions } = useChores();
  const { photos } = useGooglePhotos(PHOTO_WORKER_URL);
  const now = useNow(activeTimers.length + completedTimers.length > 0);

  const iso = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
  const tomorrowIso = addDaysIso(iso, 1);
  const nowHm = hm(now);
  const nowMin = minutesOf(nowHm);
  const morning = nowMin < 12 * 60;
  const today = days.find((d) => d.dateStr === iso) ?? days[0];
  const tomorrow = days.find((d) => d.dateStr === tomorrowIso);
  const todayEvents = today?.events ?? [];
  const weekend = isWeekendMode(iso, todayEvents);
  const schoolMorning = morning && !weekend;
  const { data: deps } = useTransit(schoolMorning);
  const disruption = schoolMorning && deps ? u2Disruption(deps) : null;

  const daily = weather?.daily;
  const di = daily ? daily.time.indexOf(iso) : -1;
  const ti = daily ? daily.time.indexOf(tomorrowIso) : -1;
  const reminders = activeReminders(now);
  const todayRem = reminders.filter((r) => r.date === iso);
  const tomorrowRem = morning ? [] : reminders.filter((r) => r.date === tomorrowIso);
  const dialRem = todayRem.find((r) => r.flashFrom && r.flashTo);

  const timers = [...activeTimers, ...completedTimers].slice(0, 3);
  const dialTimers: DialTimer[] = timers.map((t, i) => ({
    id: t.id,
    fraction: t.duration_seconds ? getRemainingSeconds(t) / t.duration_seconds : 0,
    color: TIMER_COLORS[i],
  }));
  const bedtimes = KIDS.map(({ kid, name }) => ({ kid, name, at: bedtime(kid, iso, tomorrow?.events) }));
  // A bedtime earns a pinned row from two hours before until it passes.
  const bedSoon = bedtimes.filter((b) => { const m = minutesUntil(nowHm, b.at); return m !== null && m <= 120; });
  const holiday = holidayName(iso);
  // School mornings until 09:00: the kids' jobs stay put (Ellis's one-step-at-a-time card must not flip away).
  const kidsPinned = SHOW_CHORES && schoolMorning && nowMin < 9 * 60;

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
          <div className="kd-wear"><Wear temp={w.temperature_2m} rain={daily.precipitation_probability_max?.[di] ?? 0} /></div>
        ) : !morning && daily && ti >= 0 ? (
          // The one place tomorrow's weather lives in the evening.
          <div className="kd-tmrw">
            <span className="kd-when">Tomorrow</span>
            <span className="kd-tmrwico"><WeatherIcon code={daily.weather_code[ti]} size="1em" /></span>
            <b>{Math.round(daily.temperature_2m_max[ti])}° / {Math.round(daily.temperature_2m_min[ti])}°</b>
            <span className="kd-wearsm"><Wear temp={daily.temperature_2m_min[ti]} rain={daily.precipitation_probability_max?.[ti] ?? 0} /></span>
          </div>
        ) : null}
      </>
    );
  };

  const reminderRow = (r: (typeof reminders)[number], prefix = '') => (
    <div key={r.date + r.text} className={`kd-row ${r.flashing ? 'is-flashing' : ''}`}>
      <KioskIcon name="bell" /><span className="is-wrap">{prefix}{r.text}</span>
    </div>
  );

  const kitToday = kitFor(iso, todayEvents).length > 0;
  const kitTomorrow = !morning && kitFor(tomorrowIso, tomorrow?.events ?? []).length > 0;
  const trainsOk = schoolMorning && nowMin < 9 * 60 && !!deps && !disruption;

  const kitStrip = ((morning ? kitToday : kitTomorrow) || trainsOk) && (
    <div className="kd-strip">
      {(morning ? kitToday : kitTomorrow) && <span className="kd-lbl">{morning ? 'Today, bring' : 'Pack for tomorrow'}</span>}
      <KitChips iso={morning ? iso : tomorrowIso} events={(morning ? todayEvents : tomorrow?.events) ?? []} />
      {trainsOk && <span className="kd-ok"><KioskIcon name="train" /> U2 on time</span>}
    </div>
  );

  // Kids block (only with chores on): bedtimes in the evening, kit, and the jobs.
  const kids = (
    <div className="kd-block kd-kids">
      {!morning && (
        <div className="kd-beds">
          {bedtimes.map((b) => (
            <div key={b.kid}><KioskIcon name="bed" /> {EMOJI[b.kid]} <span>{b.name}</span><b>{b.at}</b></div>
          ))}
        </div>
      )}
      {kitStrip}
      <Routine chores={chores} completions={completions} />
    </div>
  );

  // Two photo slots per cycle, each showing a different picture every time it comes round.
  const photoAt = (k: number) => (a: number) => <KioskPhoto photo={photos.length ? photos[(a * 2 + k) % photos.length] : undefined} />;
  const blocks: Record<string, (a: number) => ReactNode> = {
    photo0: photoAt(0),
    photo1: photoAt(1),
    week: () => <div className="kd-block"><Week days={days.filter((d) => d.dateStr >= iso).slice(0, 3)} weather={weather} todayIso={iso} /></div>,
    kids: () => kids,
    countdowns: () => <Countdowns now={now} />,
  };
  const order = !SHOW_CHORES || kidsPinned ? ['photo0', 'week', 'photo1', 'countdowns'] : ['kids', 'photo0', 'week', 'photo1', 'countdowns'];

  return (
    <ErrorBoundary FallbackComponent={GlobalFallback} onError={logError}>
      <div className="kd-viewport">
        <div className="kd" style={{ transform: `scale(${fit})` }}>
          <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
            <div className="kd-dialwrap">
              <KioskDial
                now={now}
                items={groupMeetings(todayEvents)}
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
            <div className="kd-flow">
              {/* Pinned: never rotates away */}
              {todayRem.map((r) => reminderRow(r))}
              {tomorrowRem.map((r) => reminderRow(r, 'Tomorrow: '))}
              {disruption && (
                <div className="kd-row is-flashing"><i className="kd-line">U2</i><span><b>{disruption}</b></span></div>
              )}
              {bedSoon.map((b) => (
                <div key={b.kid} className="kd-row">
                  <KioskIcon name="bed" /><span>{EMOJI[b.kid]} {b.name}: bedtime</span>
                  <small>{b.at} · {inText(minutesUntil(nowHm, b.at)!)}</small>
                </div>
              ))}
              {SHOW_CHORES ? kidsPinned && kids : kitStrip}
              <Rotator order={order} blocks={blocks} />
            </div>
          </ErrorBoundary>
          <div className="kd-status"><StatusBar variant="kiosk" /></div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
