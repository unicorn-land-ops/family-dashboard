#!/bin/bash
# Pipes the first USB microphone into timer_ear.py. No mic yet -> exit, systemd retries.
cd ~/timer-ear
CARD=$(arecord -l 2>/dev/null | grep -i usb | grep -m1 -o 'card [0-9]*' | cut -d' ' -f2)
[ -z "$CARD" ] && { echo 'no USB mic'; exit 1; }
set -a; . ./env; set +a
arecord -q -D plughw:$CARD,0 -f S16_LE -r 16000 -c 1 -t raw | ./venv/bin/python -u timer_ear.py
