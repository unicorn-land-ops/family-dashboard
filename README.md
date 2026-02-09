# Family Dashboard

A kitchen kiosk display for the Haynes-Culley family, running on Raspberry Pi.

![Dashboard](https://img.shields.io/badge/status-work--in--progress-yellow)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Flask](https://img.shields.io/badge/flask-2.0-green)

## Quick Start

See [PROJECT.md](PROJECT.md) for full documentation, history, and known issues.

## Features

- 🕐 Large clock (Berlin time)
- 🌤️ Weather + 7-day forecast
- 🚇 BVG U2 transit (Senefelderplatz)
- 📅 Family calendar (7-day view)
- ✅ Kids' chore tracking
- ♑ Daily horoscopes
- 🌍 Country of the Day

## Hardware

- Raspberry Pi 4
- 1080x1920 portrait display
- Always-on kiosk mode

## Files

- `app.py` - Flask backend
- `templates/dashboard.html` - Frontend
- `kiosk.sh` - Kiosk launcher
- `PROJECT.md` - Detailed docs & history

## Deployment

```bash
ssh pi@192.168.178.31
cd /home/pi/dashboard
git pull
python3 app.py &
```

## License

Private - Unicorn Land
