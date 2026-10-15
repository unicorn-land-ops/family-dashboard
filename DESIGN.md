---
name: Culley.Haynes Information Station (kiosk, layout D)
description: A 24-hour dial with the family's day on it, and the morning or evening jobs underneath, read from across the kitchen.
colors:
  day-page: "#aea8b5"
  day-panel: "#e8e6eb"
  day-panel-2: "#d6d3db"
  day-track: "#8c8694"
  day-ink: "#18161c"
  day-ink-2: "#3f3b46"
  day-ink-3: "#5d5965"
  mauve-pastel: "#b5a8af"
  sage-pastel: "#afb5a8"
  mint-pastel: "#a8b5ae"
  mauve-tint: "#e3d6dd"
  sage-tint: "#dbe0d1"
  mint-tint: "#d3e0dd"
  mauve-deep: "#6b3f55"
  sage-deep: "#4a5a2c"
  teal-deep: "#245a55"
  flash: "#e48233"
  flash-ink: "#1a1208"
  daddy-day: "#5e3a1a"
  ellis-day: "#7c4600"
  family-day: "#1f4670"
  night-page: "#141210"
  night-panel: "#1f1b18"
  night-panel-2: "#2a2420"
  night-ink: "#f5f0e8"
  night-ink-2: "#c4b8ac"
  night-orange: "#e0893e"
  night-teal: "#56bdb0"
  night-blue: "#7ba4d9"
typography:
  clock:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "240px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  row:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
  ellis:
    fontFamily: "ABeeZee, Outfit, sans-serif"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: 1.05
rounded:
  chip: "999px"
  card: "26px"
  row: "22px"
  day: "20px"
spacing:
  gutter: "40px"
  stack: "14px"
components:
  row:
    backgroundColor: "{colors.day-panel}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.row}"
    padding: "20px 26px"
  row-flashing:
    backgroundColor: "{colors.flash}"
    textColor: "{colors.flash-ink}"
  kit-chip-wren:
    backgroundColor: "{colors.mauve-tint}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.chip}"
    padding: "12px 22px"
  kit-chip-ellis:
    backgroundColor: "{colors.sage-tint}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.chip}"
    padding: "12px 22px"
  kid-card:
    backgroundColor: "{colors.day-panel}"
    rounded: "{rounded.card}"
    padding: "22px 28px"
  day-card:
    backgroundColor: "{colors.day-panel}"
    rounded: "{rounded.day}"
    padding: "14px 16px"
    height: "192px"
---

## Overview

One fixed 1080×1920 portrait screen on the kitchen wall, no touch. The top 1000px is a 24-hour dial: midnight at the bottom, noon at the top, every hour numbered (0, 6, 12, 18 bold). Today's timed events sit on the ring as arcs in the person's colour with their emoji pinned at the start time (🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis). The light part of the ring is daylight (sunrise to sunset); a teal hand marks now. Inside the dial: the clock, date, weather and what to wear, or the timers when any run.

Underneath, the content follows the clock, not the theme: before 12:00 it is the school morning (reminders, U2 disruption, kit to bring, the kids' jobs, next five days, countdowns and news); from 12:00 it is the evening (bedtimes, tomorrow's reminders, weather and kit, the photo, next five days). Saturdays, Sundays and days when both kids are off school use weekend mode: no kit, no train line, the holiday name inside the dial, the photo.

Code: `src/components/kiosk/KioskDashboard.tsx`, `KioskDial.tsx`, `KioskIcon.tsx`, `kioskD.css`; rules in `src/lib/familyRules.ts` (tested).

## Colors

Day (dawn, day and golden phases): silver with a hint of purple, `#AEA8B5`, chosen by Joshua. Night (dusk and night phases): the incumbent warm dark.

Joshua's three day accents `#B5A8AF`, `#AFB5A8`, `#A8B5AE` sit at the page's own lightness (1.0–1.1:1), so each is used through two derived tones: a **tint** for fills that carry dark text (kit chips, the holiday chip) and a **deep** tone for strokes and coloured text (timer rings, countdown numbers, the weather icon). The deep tones measure 3.25–3.7:1 on the page (graphics) and 6–6.9:1 on cards (text). Timer rings 1/2/3 are mauve, sage and teal by day; orange, teal and blue at night.

Text that sits directly on the page uses `day-ink` (7.75:1) or `day-ink-2` (4.7:1) only; `day-ink-3` (2.9:1 on the page) is for cards. Flashing orange is reserved for "do this now": reminders in their window, a U2 disruption, a ringing timer.

## Typography

Outfit throughout, tabular numerals. ABeeZee for anything Ellis reads (his card, his bedtime row, his kit chip), in German. The clock is 240px; rows 40px; labels 28px; nothing a passer-by needs is under 21px.

## Layout

Absolute positions on the 1080×1920 frame, scaled to fit any other window (1:1 on the kiosk). Dial box 1000×1000 at (40, 24); centre block 700px wide at (190, 200); the flow column runs from y 1036 to 1876 with a 14px stack gap; one element per mode grows to fill (countdowns/news in the morning, the photo in the evening and weekend). Footer status line in the last 32px.

## Elevation & Depth

Flat. Cards are separated by tone, not shadow. The only depth is the 6px page-coloured stroke round the timer knobs so they read over the rings.

## Shapes

Pills for chips, 26px cards, 22px rows, 20px day cards. Dial strokes: 44px ring, 22px reminder arc, 16px timer rings with round caps.

## Components

- **Pins:** 34px disc in the card colour with a 6px person-coloured stroke and the emoji. Bedtime pins in the evening are smaller (26px) and sit inside the ring.
- **Timers:** one timer fills the centre with a 260px countdown; two or three list as label + countdown in the ring's colour, each keyed by a dot and a knob at the ring's end. No separate boxes, no Siri phrase echo. A finished timer blinks for 60 s.
- **Kit chips:** kid emoji, kit emoji, one word. Suppressed when that kid has no school.
- **Ellis's card:** one big "Jetzt:" step with a picture (the chore's own emoji, or a drawn icon), then "Dann:" with the rest.
- **Day cards:** weekday, weather, the all-day/holiday line, up to three events; work events collapse to "HH:MM Meeting".

## Do's and Don'ts

- Do keep the dial the hero; add things to the ring before adding rows.
- Do keep emoji to family identity and the wear/kit emoji Joshua asked for; UI icons come from `KioskIcon` (one 1.8 stroke).
- Don't put Joshua's pastels behind text on the page or use them as strokes; use their tint or deep tone.
- Don't show the lights (they are visible in the room) or the full departure board (only disruptions).
- Don't tick the clock every second unless a timer runs.
