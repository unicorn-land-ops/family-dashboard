# Product

<!-- impeccable:product-schema 1 -->

> Written 14.10.2026 from Joshua's Discord answers (#family-dashboard, 19:43–19:47) and the repo. No live interview round ran (overnight, unattended); facts marked *(inferred)* come from the code or earlier conversations, not from a confirmed answer.

## Platform

web

## Users

The Culley-Haynes household in Berlin: Joshua ("Papa", 🥑), Scott ("Daddy", 🍪), Wren (13, 🌸) and Ellis (9, 🥭). They read the screen while passing through the kitchen, mostly from across the room, often in a hurry in the morning. **The family talks to the HomePod in English. Anything on screen for Ellis is in German, in the ABeeZee font: big type, one thing at a time, a picture for every step** (Joshua, 09.10.2026, `Unicorn.Land/family-dashboard/docs/homepod-options.md`). Ellis reads simple words.

## Product Purpose

A wall-mounted kitchen screen that answers "what's happening today, what's next, and what do I have to do" at a glance, without anyone touching it. Success: everyone can read the time, weather and today's plan from across the kitchen, and the kids see their own jobs and reminders.

## Operating Context

- Portrait 1080×1920 monitor (Lenovo D27-30), wall-mounted, driven by a Raspberry Pi 5 running Chromium in kiosk mode. **No touch, no mouse.** All input comes from phones (the dashboard's phone view, Discord, Supabase).
- The screen turns off at night (23:00 Sun–Thu, 00:00 Fri–Sat) and back on at 06:30. *(inferred)*
- A HomePod mini 2 arrives on 30.10.2026. Joshua wants the screen to show what's playing, live voice timers, and home controls (lights and scenes).

## Capabilities and Constraints

Existing data the screen must keep: clock, date and weather (Open-Meteo); today plus the next days plus a 2–3 week calendar from seven ICS feeds (Papa, Papa-work, Daddy, Daddy-work, Wren, Ellis, Family); countdowns; chores for Wren and Ellis; reminders, which flash inside a time window; a photo frame; a news ticker (Tagesschau and others); timers (Supabase); BVG departures at Senefelderplatz (hook exists, not shown on the kiosk today).

Confirmed asks (14.10.2026):
- Time, date and weather are too small.
- Calendar weeks 2 and 3 are too small and show too many events.
- Evening work meetings collapse into "Papa Meeting" / "Daddy Meeting", one line with the time, or a count if several. Work events are those from the `*-work` calendars.
- HomePod: now playing, voice timers, home controls (all three).

Confirmed later the same evening:
- Keep everything that exists today, and use the HomePod options menu (`family-dashboard/docs/homepod-options.md`) as input: chores by voice, visual timers, visual routines and transition warnings for Ellis, leave-the-house countdown with tram times, scenes, now playing (from the Sonos; the card appears only while music plays), night mode.
- **Rotation and promotion:** parts of the screen rotate through content; when an interaction happens (a voice timer starts) that element takes over or is promoted.
- **Voice-summoned views:** "Siri, show chores" switches the screen to a chores view; "Siri, Ellis made his bed" ticks the chore with visible confirmation.
- **Theme: a MEDIUM, mid-tone theme in the daytime (not bright white), dark after sunset.**
- Joshua = Papa (🥑), Scott = Daddy (🍪), confirmed.
- BVG departures offered as an option for him to judge.

## Brand Commitments

Family emojis are identity, not decoration: 🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family. The footer reads "Culley.Haynes Information Station" and "Made in Unicorn.Land". *(inferred)*

## Evidence on Hand

Real calendar, chores, countdowns and weather for the week of 14.10.2026 (from the live kiosk screenshot). Family photos come from Google Photos. Weeks 2–3 of the calendar beyond what the kiosk shows are not available locally; any mockup content past 20.10 is illustrative and labelled as such.

## Product Principles

1. Readable from across the kitchen beats information density.
2. Today first; later weeks are a glance, not a list.
3. The kids' own jobs are theirs to find without help.
4. No touch: anything that looks like a control must be status, driven from a phone or voice.
5. Calm by default, loud only when something needs doing now (flashing reminders, a ringing timer).

## Accessibility & Inclusion

Joshua finds dark interfaces hard to read, so the light theme must be the strong one. Ellis needs short words with icons.
