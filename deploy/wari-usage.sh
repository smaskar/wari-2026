#!/usr/bin/env bash
# आरोग्य संपन्न वारी — usage report from the anonymous beacon log.
# Usage:  ./wari-usage.sh [/var/log/nginx/wari-hits.log]
set -euo pipefail
LOG="${1:-/var/log/nginx/wari-hits.log}"

if [ ! -f "$LOG" ]; then
  echo "Log not found: $LOG"
  echo "Set up /api/hit first (see nginx-wari-analytics.conf), then wait for some visits."
  exit 1
fi

hr(){ printf '%s\n' "-----------------------------------------------------"; }
echo "====================================================="
echo " आरोग्य संपन्न वारी — App usage"
echo " Source: $LOG"
echo "====================================================="

TOTAL_OPENS=$(grep -c 'uid=' "$LOG" || true)
UNIQUE_USERS=$(grep -ohE 'uid=[^ ]+' "$LOG" | sort -u | wc -l | tr -d ' ')
echo "Total app opens (all time)   : $TOTAL_OPENS"
echo "Unique users (installs)      : $UNIQUE_USERS"
echo "Installed-app (PWA) opens    : $(grep -c 'pwa=1' "$LOG" || true)   |   Browser opens: $(grep -c 'pwa=0' "$LOG" || true)"

hr; echo "Opens per day:"
grep -ohE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' "$LOG" | sort | uniq -c | awk '{printf "  %s : %s opens\n",$2,$1}'

hr; echo "Daily ACTIVE users (unique devices/day):"
grep -ohE '^[0-9]{4}-[0-9]{2}-[0-9]{2}|uid=[^ ]+' "$LOG" \
  | paste - - | sort -u | awk '{print $1}' | sort | uniq -c \
  | awk '{printf "  %s : %s users\n",$2,$1}'

hr; echo "By device / OS:"
awk '
  /Android/{a++} /iPhone|iPad|iPod/{i++} /Windows/{w++} /Macintosh|Mac OS/{m++} /Linux/ && !/Android/{l++}
  END{printf "  Android : %d\n  iOS     : %d\n  Windows : %d\n  Mac     : %d\n  Linux   : %d\n",a,i,w,m,l}
' "$LOG"

hr; echo "By browser (approx):"
awk '
  /Edg\//{e++;next} /SamsungBrowser/{s++;next} /Firefox/{f++;next}
  /Chrome|CriOS/{c++;next} /Safari/{sa++;next}
  END{printf "  Chrome  : %d\n  Safari  : %d\n  Firefox : %d\n  Edge    : %d\n  Samsung : %d\n",c,sa,f,e,s}
' "$LOG"

hr; echo "Opens by hour of day (IST):"
grep -ohE 'T[0-9]{2}:' "$LOG" | sed 's/[T:]//g' | sort | uniq -c | awk '{printf "  %s:00  %s\n",$2,$1}'
