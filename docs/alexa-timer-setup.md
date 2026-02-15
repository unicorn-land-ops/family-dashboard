# Alexa Timer Display Setup

This guide walks you through setting up Alexa timer display on your Home Assistant dashboard.

## Overview

The Alexa Media Player integration exposes your Echo devices' timers, alarms, and reminders as sensors in Home Assistant. Combined with a custom Lovelace card, you can display active timers on your wall dashboard.

## Prerequisites

- Home Assistant installed and running
- Amazon Echo device on the same network
- Amazon account credentials

## Step 1: Install HACS

HACS (Home Assistant Community Store) is required to install the Alexa Media Player integration.

1. Open Home Assistant terminal or SSH
2. Run the HACS installation script:
   ```bash
   wget -O - https://get.hacs.xyz | bash -
   ```
3. Restart Home Assistant
4. Go to **Settings → Devices & Services → Add Integration**
5. Search for "HACS" and complete setup
6. Restart Home Assistant again

For detailed instructions: https://hacs.xyz/docs/setup/download

## Step 2: Install Alexa Media Player

1. Go to **HACS → Integrations**
2. Click the **+ Explore & Download Repositories** button
3. Search for "Alexa Media Player"
4. Click **Download**
5. Restart Home Assistant
6. Go to **Settings → Devices & Services → Add Integration**
7. Search for "Alexa Media Player"

## Step 3: Authenticate with Amazon

The Alexa Media Player uses a web-based authentication flow:

1. When prompted, select your Amazon domain (amazon.com, amazon.de, etc.)
2. A login page will appear in your browser
3. Enter your Amazon credentials
4. Complete any 2FA prompts
5. You may see a CAPTCHA - complete it
6. If you see an OTP (one-time password) request, check your email

### Troubleshooting Authentication

**"Confirmation required" error:**
- Check your email for an Amazon security notification
- Click the approval link in the email
- Retry the authentication

**CAPTCHA keeps appearing:**
- Try using a different browser
- Clear cookies and try again
- Some users report success with mobile browsers

**"Unknown error" during login:**
- Wait a few minutes and try again
- Check if Amazon services are experiencing issues

## Step 4: Configure Entities

After successful authentication, you should see your Echo devices listed:

1. Go to **Settings → Devices & Services → Alexa Media Player**
2. Click on your Echo device
3. Note the entity IDs, especially:
   - `sensor.echo_[name]_next_timer` - Timer information
   - `sensor.echo_[name]_next_alarm` - Alarm information
   - `media_player.echo_[name]` - Media player controls

## Step 5: Install Timer Card (Optional but Recommended)

For a nice visual display of timers:

1. Go to **HACS → Frontend**
2. Click **+ Explore & Download Repositories**
3. Search for "alexa-alarms-timers-card"
4. Click **Download**
5. Refresh your browser (Ctrl+Shift+R)

Repository: https://github.com/Kethlak/card-alexa-alarms-timers

## Step 6: Add Timer Card to Dashboard

### Option A: Using the Custom Card

```yaml
type: custom:alexa-alarms-timers-card
entity: sensor.echo_kitchen_next_timer  # Replace with your entity
title: Kitchen Timers
show_empty: true
empty_message: "No active timers"
```

### Option B: Using a Template Card (Manual Countdown)

If the custom card doesn't work, use this template approach:

```yaml
type: markdown
content: |
  # Timers
  {% set timers = state_attr('sensor.echo_kitchen_next_timer', 'sorted_active') %}
  {% if timers and timers | length > 0 %}
    {% for timer in timers %}
      {% set remaining = as_timestamp(timer.date_time) - as_timestamp(now()) %}
      {% if remaining > 0 %}
        {% set mins = (remaining // 60) | int %}
        {% set secs = (remaining % 60) | int %}
  ### {{ timer.label or 'Timer' }}: {{ '%d:%02d' | format(mins, secs) }}
      {% endif %}
    {% endfor %}
  {% else %}
  *No active timers*
  {% endif %}
```

### Option C: Simple Entity Card

```yaml
type: entity
entity: sensor.echo_kitchen_next_timer
name: Next Timer
```

## Step 7: Test the Setup

1. Say "Alexa, set a 5 minute timer"
2. Check Home Assistant:
   - Go to **Developer Tools → States**
   - Search for your timer entity
   - Verify the timer data is present
3. Check your dashboard - the timer should appear within 30 seconds

## Understanding Timer Data

The timer sensor provides these attributes:

```yaml
sorted_active:  # List of active timers
  - date_time: "2024-01-15T14:30:00+01:00"
    label: "Eggs"
    status: "ON"
    id: "timer-123"
sorted_all:     # All timers including completed
process_timestamp: "2024-01-15T14:25:00+01:00"
```

## Refresh Rate

Timer data updates every 30-60 seconds by default. For faster updates:

1. Add this automation to your configuration:

```yaml
automation:
  - alias: "Refresh Alexa Timer Data"
    trigger:
      - platform: time_pattern
        seconds: "/15"  # Every 15 seconds
    condition:
      - condition: state
        entity_id: sensor.echo_kitchen_next_timer
        attribute: sorted_active
        # Only refresh when timers are active
    action:
      - service: alexa_media.update_last_called
        data: {}
```

## Multiple Echo Devices

If you have multiple Echo devices and want to show all timers:

```yaml
type: vertical-stack
cards:
  - type: custom:alexa-alarms-timers-card
    entity: sensor.echo_kitchen_next_timer
    title: Kitchen
  - type: custom:alexa-alarms-timers-card
    entity: sensor.echo_living_room_next_timer
    title: Living Room
```

## Re-Authentication

Amazon sessions expire periodically. When this happens:

1. You'll see errors in the HA logs
2. Go to **Settings → Devices & Services → Alexa Media Player**
3. Click **Configure**
4. Select **Relogin**
5. Complete the authentication flow again

To minimize re-auth frequency:
- Use an Amazon account that doesn't have 2FA enabled on every login
- Consider creating a dedicated Amazon account for HA

## Troubleshooting

### Timers not showing
- Check the entity exists in Developer Tools → States
- Verify the entity has the `sorted_active` attribute
- Check HA logs for Alexa Media Player errors

### "Unknown" state
- Re-authenticate with Amazon
- Restart Home Assistant
- Check your internet connection

### Card shows "No active timers" but timer is running
- Entity ID might be wrong
- Timer might be on a different Echo device
- Data hasn't synced yet (wait 30-60 seconds)

### Authentication keeps failing
- Try a different browser
- Clear browser cookies
- Disable VPN if using one
- Check Amazon account security settings

## Resources

- [Alexa Media Player Documentation](https://github.com/custom-components/alexa_media_player/wiki)
- [Timer Card Repository](https://github.com/Kethlak/card-alexa-alarms-timers)
- [Home Assistant Community Forum](https://community.home-assistant.io/t/alexa-media-player-custom-component/)
