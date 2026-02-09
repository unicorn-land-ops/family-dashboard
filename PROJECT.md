# Family Dashboard - Kitchen Kiosk

## Overview
A Raspberry Pi-based kitchen display for the Haynes-Culley family. Shows calendar events, weather, BVG transit, chore tracking, and daily horoscopes on a portrait-mode screen.

**Hardware:** Raspberry Pi 4 (192.168.178.31) + 1080x1920 portrait display  
**Location:** Kitchen wall (always on, no touch)  
**Repo:** https://github.com/Unicornland/family-dashboard

---

## Architecture

```
┌─────────────────────────────────────┐
│  Raspberry Pi 4 (192.168.178.31)   │
│  ├─ Flask app (port 5000)          │
│  ├─ Chromium kiosk mode            │
│  └─ 1080x1920 portrait display     │
└─────────────────────────────────────┘
```

### Key Files
- `app.py` - Flask backend (calendar parsing, BVG API, weather, chores)
- `templates/dashboard.html` - Frontend UI (rotated for portrait)
- `kiosk.sh` - Launches Chromium in kiosk mode
- `data.json` - Local cache (events, weather, chore state)

---

## Features

### 1. Large Clock (Berlin Time)
- 10rem font, top of screen
- Auto-updates every second

### 2. Weather + 7-Day Forecast
- Open-Meteo API (Berlin coordinates)
- Current temp + weather emoji
- 7-day forecast with highs/lows

### 3. BVG U2 Transit (Senefelderplatz)
- Real-time departures
- Shows next 3 trains (not 5)
- U2 logo is red (#FF3333)
- Platform and direction info

### 4. Calendar Events (7-day window)
**Calendars synced:**
- Family (shared events)
- Papa (Joshua) - work hours 9am-6pm filtered out
- Daddy (Scott) - **ALL events shown** (no work filter)
- Wren - recurring events (Wren Duden, etc.)
- Ellis

**Known Issues:**
- Calendar fetch takes 75+ seconds due to RRULE expansion
- Background thread times out before completing
- Events not caching properly (cached_events stays empty)
- Wren's calendar has 365+ events with weekly recurrences

### 5. Chore Tracking
**Wren:** dishes, room, homework → 120 min screen time when all done  
**Ellis:** toys, bed, teeth → 60 min screen time when all done

### 6. Daily Horoscope (not Astrology)
- Shows 3 signs: ♑ Capricorn, ♒ Aquarius, ♐ Sagittarius
- Hardcoded daily readings (Aztro API unreliable)
- Changes daily based on day-of-year

### 7. Country of the Day
- REST Countries API
- Shows flag, capital, population, fun fact

---

## Technical Details

### Display Rotation
```bash
# /boot/firmware/config.txt
display_rotate=1  # 90° clockwise
```

### Fonts
- Noto Color Emoji installed for emoji support
- Large fonts: time (10rem), headers (2.2-2.5rem)

### Refresh Interval
- Frontend: 5 minutes (300000ms)
- Backend calendar: every 60 seconds (but times out)

### Timezone
- All times in Berlin (CET/CEST, UTC+1/+2)
- ICS parsing converts UTC to Berlin time (+1 hour)

---

## History & Evolution

### Feb 9, 2026 - Major Issues Discovered
1. **Wren's 16:00 event missing** - Event exists in Google Calendar but not in ICS feed
2. **Scott's calendar empty** - Filter was blocking 9am-6pm events (fixed)
3. **RRULE expansion broken** - Code had undefined constants (DAILY, WEEKLY)
4. **Performance issue** - 365+ events take 75+ seconds to process
5. **Background thread timing out** - Never completes, events stay at 0

### Attempted Fixes
- Added RRULE handling for recurring events
- Fixed regex to capture `DTSTART;TZID=Europe/Berlin:` format
- Limited to 100 events per calendar
- Fixed Scott's filter (removed 9am-6pm block)

### Still Broken
- Calendar fetch in background thread never completes
- Events not caching to data.json
- Need to either:
  - Run calendar fetch once at startup (not loop)
  - Cache for 24 hours instead of 60 seconds
  - Use faster library (icalendar, recurring-ical-events)

---

## Known Issues Checklist

- [ ] Calendar events not populating (background thread times out)
- [ ] RRULE expansion works but too slow (75s vs 60s timeout)
- [ ] Wren's 16:00 event - need to verify if in ICS feed
- [ ] Scott's doctor appointment should show tomorrow at 09:00
- [ ] Verify horoscopes refresh daily

---

## File Locations

### On Raspberry Pi:
```
/home/pi/dashboard/
├── app.py
├── templates/dashboard.html
├── data.json
└── config.json (optional)

/home/pi/kiosk.sh
```

### On Mac (local dev):
```
/Users/joshua/.openclaw/workspace/projects/family-dashboard/
├── app.py
├── templates/dashboard.html
└── kiosk.sh
```

---

## Deployment

```bash
# SSH to Pi
ssh pi@192.168.178.31  # password: pi

# Pull updates
cd /home/pi/dashboard
git pull

# Restart
pkill -f "python3 app.py"
python3 app.py &

# Or reboot
sudo reboot
```

---

## API Endpoints

- `GET /api/status` - Full dashboard state (chores, events, weather, etc.)
- `POST /api/toggle/<kid>/<chore>` - Toggle chore completion
- `GET/POST/DELETE /api/grocery` - Grocery list management
- `POST /api/alexa/*` - Alexa webhook endpoints

---

## Future Improvements

1. **Fix calendar performance** - Use caching, run once at startup
2. **Add deployment script** - systemd service instead of manual start
3. **Better error handling** - Log calendar fetch errors
4. **Screen time countdown** - Show remaining time visually
5. **Birthday reminders** - Special display for family birthdays

---

## Contact

**Obadiah (AI)** - Chief of Staff  
**Joshua** - Human in charge  
**Pi Location:** 192.168.178.31
