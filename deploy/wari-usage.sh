#!/usr/bin/env bash
# आरोग्य संपन्न वारी — quick text usage report from the anonymous beacon log.
# (For charts/location/call funnel, use wari-dashboard.py instead.)
# Usage:  ./wari-usage.sh [/var/log/nginx/wari-hits.log]
set -euo pipefail
LOG="${1:-/var/log/nginx/wari-hits.log}"

if [ ! -f "$LOG" ]; then
  echo "Log not found: $LOG"
  echo "Set up /api/hit first (see nginx-wari-analytics.conf), then wait for some visits."
  exit 1
fi

hr(){ printf '%s\n' "-----------------------------------------------------"; }
# OPENS = beacons that are NOT interaction events (e=call / e=loc)
OPENS="$(grep 'uid=' "$LOG" | grep -vE 'e=call|e=loc' || true)"

echo "====================================================="
echo " आरोग्य संपन्न वारी — App usage"
echo " Source: $LOG"
echo "====================================================="

TOTAL_OPENS=$(printf '%s\n' "$OPENS" | grep -c 'uid=' || true)
UNIQUE_USERS=$(printf '%s\n' "$OPENS" | grep -ohE 'uid=[^ ]+' | sort -u | wc -l | tr -d ' ')
echo "Total app opens (all time)   : $TOTAL_OPENS"
echo "Unique users (installs)      : $UNIQUE_USERS"
echo "Installed-app (PWA) opens    : $(printf '%s\n' "$OPENS" | grep -c 'pwa=1' || true)   |   Browser opens: $(printf '%s\n' "$OPENS" | grep -c 'pwa=0' || true)"

hr; echo "📞 Phone-call taps (real use):"
echo "  108      : $(grep -c 'e=call k=108' "$LOG" || true)"
echo "  112      : $(grep -c 'e=call k=112' "$LOG" || true)"
echo "  102      : $(grep -c 'e=call k=102' "$LOG" || true)"
echo "  contact  : $(grep -c 'e=call k=contact' "$LOG" || true)   (facility / officer direct numbers)"

hr; echo "📍 Top areas (nearest mukkam, when location used):"
grep 'e=loc' "$LOG" | grep -ohE 'near=[^ ]+' | sort | uniq -c | sort -rn | head -15 | awk '{printf "  %-18s %s\n",substr($2,6),$1}'

hr; echo "Opens per day:"
printf '%s\n' "$OPENS" | grep -ohE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' | sort | uniq -c | awk '{printf "  %s : %s opens\n",$2,$1}'

hr; echo "Daily ACTIVE users (unique devices/day):"
printf '%s\n' "$OPENS" | grep -ohE '^[0-9]{4}-[0-9]{2}-[0-9]{2}|uid=[^ ]+' \
  | paste - - | sort -u | awk '{print $1}' | sort | uniq -c \
  | awk '{printf "  %s : %s users\n",$2,$1}'

hr; echo "By device / OS (opens):"
printf '%s\n' "$OPENS" | awk '
  /Android/{a++} /iPhone|iPad|iPod/{i++} /Windows/{w++} /Macintosh|Mac OS/{m++} /Linux/ && !/Android/{l++}
  END{printf "  Android : %d\n  iOS     : %d\n  Windows : %d\n  Mac     : %d\n  Linux   : %d\n",a,i,w,m,l}'

hr; echo "Opens by hour of day (IST):"
printf '%s\n' "$OPENS" | grep -ohE 'T[0-9]{2}:' | sed 's/[T:]//g' | sort | uniq -c | awk '{printf "  %s:00  %s\n",$2,$1}'
