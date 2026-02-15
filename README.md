# Family Dashboard

A self-hosted DAKboard replacement using Home Assistant, featuring:
- Clock and date display
- Google Calendar integration
- Weather widget
- BVG Berlin transit departures
- **Alexa timer display** (new!)
- **Shared grocery list with voice commands** (new!)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WALL DISPLAY (Pi)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Home Assistant Lovelace Dashboard           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│   │
│  │  │ Calendar │ │ Weather  │ │  BVG Departures  ││   │
│  │  └──────────┘ └──────────┘ └──────────────────┘│   │
│  │  ┌──────────────────┐ ┌───────────────────────┐│   │
│  │  │  ALEXA TIMERS    │ │    GROCERY LIST       ││   │
│  │  │  🍳 Eggs: 4:32   │ │    ☐ Milk            ││   │
│  │  │  🍞 Bread: 12:00 │ │    ☐ Eggs            ││   │
│  │  └──────────────────┘ └───────────────────────┘│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Raspberry Pi 4 (4GB recommended, 2GB minimum)
- MicroSD card (32GB+)
- Display with HDMI input
- Amazon Echo device (for Alexa timers)
- Google account (for calendar)
- OurGroceries account (free)

## Quick Start

### Phase 1: Install Home Assistant

1. Download Home Assistant OS from https://www.home-assistant.io/installation/raspberrypi
2. Flash to SD card using Raspberry Pi Imager
3. Boot the Pi and wait ~20 minutes for initial setup
4. Access at `http://homeassistant.local:8123`
5. Complete the onboarding wizard

### Phase 2: Add Core Integrations

#### Google Calendar
1. Go to Settings → Devices & Services → Add Integration
2. Search for "Google Calendar"
3. Follow OAuth flow to authenticate
4. Select calendars to sync

#### Weather
1. Settings → Devices & Services → Add Integration
2. Search for "OpenWeatherMap" (or your preferred provider)
3. Get free API key from https://openweathermap.org/api
4. Configure location (Berlin)

### Phase 3: Alexa Timer Display

See [docs/alexa-timer-setup.md](docs/alexa-timer-setup.md) for detailed instructions.

Summary:
1. Install HACS (Home Assistant Community Store)
2. Install Alexa Media Player via HACS
3. Install card-alexa-alarms-timers custom card
4. Add to dashboard

### Phase 4: Grocery List (OurGroceries)

1. Create account at https://www.ourgroceries.com
2. In HA: Settings → Devices & Services → Add Integration → OurGroceries
3. Enter your credentials
4. Test voice commands:
   - "Hey Siri, add milk with OurGroceries"
   - "Alexa, add eggs with OurGroceries"

### Phase 5: BVG Transit

1. In HACS, add custom repository: `vas3k/home-assistant-berlin-transport`
2. Install Berlin Transport integration
3. Restart Home Assistant
4. Add integration via Settings → Devices & Services
5. Configure your station and walking time

### Phase 6: Dashboard Setup

1. Copy `ha-config/lovelace/wall-dashboard.yaml` content
2. In HA: Settings → Dashboards → Add Dashboard
3. Name it "Wall Display"
4. Edit dashboard → Raw configuration editor
5. Paste the YAML
6. Save

### Phase 7: Pi Kiosk Mode

```bash
# Run the kiosk setup script
chmod +x scripts/kiosk-setup.sh
sudo ./scripts/kiosk-setup.sh

# Configure autostart
chmod +x scripts/autostart.sh
mkdir -p ~/.config/autostart
cp scripts/autostart.sh ~/.config/autostart/

# Reboot to apply
sudo reboot
```

## Configuration Files

| File | Purpose |
|------|---------|
| `ha-config/configuration.yaml` | HA configuration snippets to add |
| `ha-config/lovelace/wall-dashboard.yaml` | Dashboard layout |
| `scripts/kiosk-setup.sh` | Pi display configuration |
| `scripts/autostart.sh` | Browser auto-launch |
| `docs/alexa-timer-setup.md` | Alexa Media Player guide |

## Voice Commands

### Alexa
- "Alexa, set a 5 minute timer"
- "Alexa, set a timer for eggs for 10 minutes"
- "Alexa, add milk with OurGroceries"

### Siri
- "Hey Siri, add bread with OurGroceries"
- "Hey Siri, add bananas to my grocery list" (if OurGroceries is set as default)

## Verification Checklist

- [ ] Alexa timer appears on dashboard within 30 seconds
- [ ] Voice-added grocery items appear on dashboard
- [ ] Calendar events sync from Google
- [ ] BVG departures show real-time arrivals
- [ ] Dashboard auto-loads on Pi reboot
- [ ] Screen stays on overnight (no blanking)

## Troubleshooting

### Alexa timers not showing
- Check Alexa Media Player is authenticated (may need re-auth periodically)
- Verify the timer sensor entity exists in Developer Tools → States
- Ensure your Echo is selected in the card configuration

### Grocery list not updating
- Verify OurGroceries credentials are correct
- Check the shopping_list entity in Developer Tools
- Restart the OurGroceries integration

### Dashboard not loading on boot
- Check autostart script permissions
- Verify chromium-browser is installed
- Check HA URL is accessible from Pi

### Screen blanking despite settings
- Check both DPMS and screensaver are disabled
- Verify xset commands in autostart
- May need to edit `/etc/lightdm/lightdm.conf`

## Cost Comparison

| Item | DAKboard | This Solution |
|------|----------|---------------|
| Annual cost | $35/year | $0 |
| Alexa Timers | ❌ | ✅ |
| Voice grocery list | Limited | ✅ Full |
| Customization | Limited | Unlimited |

## Future Enhancements

- [ ] Add smart home device controls
- [ ] Add family member location/presence
- [ ] Add package tracking
- [ ] Add meal planning integration
- [ ] Add photo slideshow from Google Photos

## Resources

- [Home Assistant Docs](https://www.home-assistant.io/docs/)
- [HACS](https://hacs.xyz/)
- [Alexa Media Player](https://github.com/custom-components/alexa_media_player)
- [Berlin Transport Integration](https://github.com/vas3k/home-assistant-berlin-transport)
- [OurGroceries Integration](https://www.home-assistant.io/integrations/ourgroceries/)
