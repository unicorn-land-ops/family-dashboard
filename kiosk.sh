#!/bin/bash

# Prevent multiple instances
LOCKFILE=/tmp/kiosk.lock
if [ -f "$LOCKFILE" ]; then
    PID=$(cat "$LOCKFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Kiosk already running (PID: $PID)"
        exit 0
    fi
fi
echo $$ > "$LOCKFILE"

# Kill any existing Chromium
pkill -9 chromium 2>/dev/null
sleep 2

# Wait for X
while ! xdpyinfo -display :0 &>/dev/null; do sleep 1; done

export DISPLAY=:0

# Kill screensavers
pkill -9 xscreensaver 2>/dev/null
pkill -9 light-locker 2>/dev/null

# Disable ALL screen blanking
for i in 1 2 3; do
    xset s off
    xset s noblank  
    xset -dpms
    sleep 1
done

# Wait for backend
while ! curl -s http://localhost:5000 > /dev/null; do sleep 1; done

# Launch Chromium - SINGLE INSTANCE
exec /usr/lib/chromium/chromium \
    --kiosk \
    --app=http://localhost:5000 \
    --no-first-run \
    --no-default-browser-check \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --user-data-dir=/home/pi/.chromium-kiosk \
    --disable-restore-session-state
