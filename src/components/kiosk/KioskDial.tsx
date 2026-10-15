import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '../../lib/utils/timeFormat';
import type { DayItem } from '../../lib/familyRules';

// 24-hour dial: midnight at the bottom, noon at the top. viewBox 1000×1000.
const R = 440;
const C = 500;

export const EMOJI: Record<string, string> = { papa: '🥑', daddy: '🍪', wren: '🌸', ellis: '🥭', family: '🏠' };

const hm = (d: Date) => formatInTimeZone(d, TIMEZONE, 'HH:mm');
export const minutesOf = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const ang = (t: string) => ((minutesOf(t) / 1440) * 360 + 180) % 360;
const pt = (a: number, r: number) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];

function arc(a0: number, a1: number, r: number) {
  if (a1 < a0) a1 += 360;
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a1, r);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

export interface DialTimer { id: string; fraction: number; color: string }
export interface DialMark { time: string; emoji: string; color: string }

interface Props {
  now: Date;
  items: DayItem[];
  sunrise?: string;
  sunset?: string;
  reminder?: { from: string; to: string; flashing: boolean };
  timers: DialTimer[];
  marks: DialMark[];
}

export function KioskDial({ now, items, sunrise, sunset, reminder, timers, marks }: Props) {
  const a = ang(hm(now));
  const [hx, hy] = pt(a, R + 22);
  const [tx, ty] = pt(a, R - 30);

  return (
    <svg className="kd-dial" viewBox="0 0 1000 1000" role="img" aria-label={`Day dial, ${hm(now)}`}>
      <circle className="kd-track" cx={C} cy={C} r={R} />
      {sunrise && sunset && <path className="kd-daylight" d={arc(ang(sunrise), ang(sunset), R)} />}
      {items.map((e) => {
        const end = minutesOf(hm(e.end)) <= minutesOf(hm(e.start)) ? '23:59' : hm(e.end);
        return <path key={`a${e.key}`} className="kd-ev" stroke={`var(--p-${e.person})`} d={arc(ang(hm(e.start)) + 0.6, ang(end) - 0.6, R)} />;
      })}
      {reminder && <path className={`kd-rem ${reminder.flashing ? 'is-flashing' : ''}`} d={arc(ang(reminder.from), ang(reminder.to) + 2, R - 46)} />}
      {timers.map((t, i) => {
        const r = 380 - i * 26;
        const end = 359.9 * t.fraction;
        const [kx, ky] = pt(end, r);
        return (
          <g key={t.id}>
            <circle className="kd-tring" cx={C} cy={C} r={r} />
            <path className="kd-tleft" stroke={t.color} d={arc(0, end, r)} />
            {timers.length > 1 && <circle className="kd-knob" cx={kx} cy={ky} r={17} fill={t.color} />}
          </g>
        );
      })}
      {Array.from({ length: 24 }, (_, h) => {
        const [x, y] = pt(ang(`${h}:00`), R + 62);
        return <text key={h} className={`kd-hour ${h % 6 ? '' : 'is-q'}`} x={x} y={y}>{h}</text>;
      })}
      <line className="kd-hand" x1={tx} y1={ty} x2={hx} y2={hy} />
      <circle cx={hx} cy={hy} r={14} fill="var(--now)" />
      {marks.map((m) => {
        const [x, y] = pt(ang(m.time), R);
        return (
          <g key={`m${m.time}${m.emoji}`} className="kd-pin is-small">
            <circle cx={x} cy={y} r={26} stroke={m.color} />
            <text x={x} y={y + 2}>{m.emoji}</text>
          </g>
        );
      })}
      {items.map((e) => {
        const [x, y] = pt(ang(hm(e.start)), R);
        return (
          <g key={`p${e.key}`} className="kd-pin">
            <circle cx={x} cy={y} r={34} stroke={`var(--p-${e.person})`} />
            <text x={x} y={y + 2}>{EMOJI[e.person] ?? '•'}</text>
          </g>
        );
      })}
    </svg>
  );
}
