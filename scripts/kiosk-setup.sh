#!/bin/bash
# =============================================================================
# Raspberry Pi Kiosk Mode Setup Script
# For Home Assistant Wall Display
# =============================================================================
# Run with: sudo ./kiosk-setup.sh
# =============================================================================

set -e

echo "========================================"
echo "  Family Dashboard - Kiosk Setup"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./kiosk-setup.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(getent passwd "$ACTUAL_USER" | cut -d: -f6)

echo ""
echo "Setting up kiosk mode for user: $ACTUAL_USER"
echo ""

# =============================================================================
# 1. Update system and install dependencies
# =============================================================================
echo "[1/7] Updating system and installing dependencies..."

apt-get update -qq
apt-get install -y -qq \
    chromium-browser \
    unclutter \
    xdotool \
    x11-xserver-utils \
    lightdm \
    xserver-xorg \
    xinit

echo "✓ Dependencies installed"

# =============================================================================
# 2. Disable screen blanking (DPMS)
# =============================================================================
echo "[2/7] Disabling screen blanking..."

# Create Xorg configuration to disable DPMS
mkdir -p /etc/X11/xorg.conf.d
cat > /etc/X11/xorg.conf.d/10-monitor.conf << 'EOF'
Section "ServerFlags"
    Option "BlankTime" "0"
    Option "StandbyTime" "0"
    Option "SuspendTime" "0"
    Option "OffTime" "0"
    Option "DPMS" "false"
EndSection

Section "Monitor"
    Identifier "Monitor0"
    Option "DPMS" "false"
EndSection
EOF

echo "✓ Screen blanking disabled in Xorg"

# =============================================================================
# 3. Disable screensaver
# =============================================================================
echo "[3/7] Disabling screensaver..."

# LightDM configuration
mkdir -p /etc/lightdm/lightdm.conf.d
cat > /etc/lightdm/lightdm.conf.d/50-kiosk.conf << EOF
[Seat:*]
xserver-command=X -s 0 -dpms
autologin-user=$ACTUAL_USER
autologin-user-timeout=0
EOF

echo "✓ Screensaver disabled, autologin configured"

# =============================================================================
# 4. Configure unclutter (hide mouse cursor)
# =============================================================================
echo "[4/7] Configuring cursor hiding..."

# Unclutter hides the mouse cursor after inactivity
mkdir -p "$ACTUAL_HOME/.config/autostart"
cat > "$ACTUAL_HOME/.config/autostart/unclutter.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Unclutter
Exec=unclutter -idle 0.5 -root
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

chown "$ACTUAL_USER:$ACTUAL_USER" "$ACTUAL_HOME/.config/autostart/unclutter.desktop"

echo "✓ Cursor hiding configured"

# =============================================================================
# 5. Disable Wi-Fi power management (prevents disconnects)
# =============================================================================
echo "[5/7] Disabling Wi-Fi power management..."

cat > /etc/NetworkManager/conf.d/wifi-powersave-off.conf << 'EOF'
[connection]
wifi.powersave = 2
EOF

echo "✓ Wi-Fi power management disabled"

# =============================================================================
# 6. Set up auto-login and session
# =============================================================================
echo "[6/7] Configuring auto-login session..."

# Create a minimal desktop session for kiosk
mkdir -p /usr/share/xsessions
cat > /usr/share/xsessions/kiosk.desktop << 'EOF'
[Desktop Entry]
Name=Kiosk
Comment=Minimal kiosk session
Exec=/usr/local/bin/kiosk-session
Type=Application
EOF

# Create the kiosk session script
cat > /usr/local/bin/kiosk-session << 'SCRIPT'
#!/bin/bash

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor
unclutter -idle 0.5 -root &

# Wait for network
sleep 5

# Start the browser autostart script
exec /home/$USER/.config/autostart/dashboard-browser.sh
SCRIPT

chmod +x /usr/local/bin/kiosk-session

echo "✓ Kiosk session configured"

# =============================================================================
# 7. Create systemd service for display recovery
# =============================================================================
echo "[7/7] Creating display recovery service..."

cat > /etc/systemd/system/display-recovery.service << 'EOF'
[Unit]
Description=Display Recovery Service
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=/usr/bin/xset -display :0 dpms force on
ExecStart=/usr/bin/xset -display :0 s reset

[Install]
WantedBy=graphical-session.target
EOF

systemctl daemon-reload
systemctl enable display-recovery.service

echo "✓ Display recovery service created"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit scripts/autostart.sh with your Home Assistant URL"
echo "2. Copy autostart.sh to ~/.config/autostart/dashboard-browser.sh"
echo "3. Make it executable: chmod +x ~/.config/autostart/dashboard-browser.sh"
echo "4. Reboot: sudo reboot"
echo ""
echo "Your display will automatically:"
echo "  • Log in without password"
echo "  • Launch Chromium in kiosk mode"
echo "  • Keep the screen always on"
echo "  • Hide the mouse cursor"
echo ""
echo "To exit kiosk mode: Press Alt+F4 or SSH in and run:"
echo "  pkill chromium"
echo ""
