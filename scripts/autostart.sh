#!/bin/bash
# =============================================================================
# Family Dashboard - Browser Autostart Script
# =============================================================================
# This script launches Chromium in kiosk mode pointing to the static dashboard
# hosted on GitHub Pages. No local server needed.
#
# Installation:
#   1. Edit the DASHBOARD_URL below if using a custom domain
#   2. Copy to: ~/.config/autostart/dashboard-browser.sh
#   3. Make executable: chmod +x ~/.config/autostart/dashboard-browser.sh
# =============================================================================

# =============================================================================
# CONFIGURATION - Edit these values
# =============================================================================

# Static dashboard hosted on GitHub Pages
DASHBOARD_URL="https://unicorn-land-ops.github.io/family-dashboard/"

# Screen resolution (set to your display's native resolution)
SCREEN_WIDTH=1920
SCREEN_HEIGHT=1080

# Chromium user data directory (for persistent sessions)
CHROMIUM_DATA_DIR="$HOME/.config/chromium-kiosk"

# =============================================================================
# SETUP - Don't edit below unless needed
# =============================================================================

# Log file for debugging
LOG_FILE="/tmp/dashboard-browser.log"
exec > >(tee -a "$LOG_FILE") 2>&1
echo ""
echo "========================================"
echo "Dashboard Browser Starting: $(date)"
echo "========================================"

# Wait for X server
while ! xset q &>/dev/null; do
    echo "Waiting for X server..."
    sleep 1
done
echo "✓ X server ready"

# Disable screen blanking
echo "Disabling screen blanking..."
xset s off
xset s noblank
xset -dpms
echo "✓ Screen blanking disabled"

# Set screen resolution if needed
if command -v xrandr &> /dev/null; then
    echo "Setting resolution to ${SCREEN_WIDTH}x${SCREEN_HEIGHT}..."
    xrandr --output HDMI-1 --mode "${SCREEN_WIDTH}x${SCREEN_HEIGHT}" 2>/dev/null || \
    xrandr --output HDMI-0 --mode "${SCREEN_WIDTH}x${SCREEN_HEIGHT}" 2>/dev/null || \
    echo "Could not set resolution (may already be correct)"
fi

# Create Chromium data directory
mkdir -p "$CHROMIUM_DATA_DIR"

# Clear Chromium crash flags (prevents "restore session" dialogs)
echo "Clearing Chromium crash flags..."
rm -f "$CHROMIUM_DATA_DIR/Default/Preferences" 2>/dev/null
mkdir -p "$CHROMIUM_DATA_DIR/Default"
cat > "$CHROMIUM_DATA_DIR/Default/Preferences" << 'EOF'
{
    "profile": {
        "exit_type": "Normal",
        "exited_cleanly": true
    }
}
EOF

# Wait for network (important for HA connection)
echo "Waiting for network..."
MAX_WAIT=30
WAITED=0
while ! ping -c 1 -W 1 github.com &>/dev/null && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 1
    ((WAITED++))
    echo "  Waiting for network... ($WAITED/$MAX_WAIT)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠ Network timeout, continuing anyway..."
else
    echo "✓ Network ready"
fi

# Brief pause for network stack to stabilize
sleep 2

# =============================================================================
# LAUNCH BROWSER
# =============================================================================
echo "Launching Chromium..."
echo "URL: $DASHBOARD_URL"

# Chromium flags for kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --no-first-run \
    --start-fullscreen \
    --disable-translate \
    --disable-features=TranslateUI \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disable-gesture-typing \
    --check-for-update-interval=31536000 \
    --user-data-dir="$CHROMIUM_DATA_DIR" \
    --window-size="${SCREEN_WIDTH},${SCREEN_HEIGHT}" \
    --window-position=0,0 \
    --app="$DASHBOARD_URL" \
    &

BROWSER_PID=$!
echo "✓ Chromium started (PID: $BROWSER_PID)"

# =============================================================================
# KEEP-ALIVE LOOP
# =============================================================================
# Monitor browser and restart if it crashes

echo "Entering keep-alive loop..."
while true; do
    if ! kill -0 $BROWSER_PID 2>/dev/null; then
        echo "$(date): Browser crashed, restarting..."
        sleep 2

        chromium-browser \
            --kiosk \
            --noerrdialogs \
            --disable-infobars \
            --disable-session-crashed-bubble \
            --no-first-run \
            --user-data-dir="$CHROMIUM_DATA_DIR" \
            --app="$DASHBOARD_URL" \
            &

        BROWSER_PID=$!
        echo "Browser restarted (PID: $BROWSER_PID)"
    fi

    # Prevent screen blanking periodically
    xset s reset 2>/dev/null

    sleep 60
done
