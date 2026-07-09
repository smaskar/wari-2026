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

echo "==================================================="
echo " आरोग्य संपन्न वारी — App usage"
echo " Source: $LOG"
echo "==================================================="

TOTAL_USERS=$(grep -ohE 'uid=[^ ]+' "$LOG" | sort -u | wc -l | tr -d ' ')
TOTAL_OPENS=$(grep -c 'uid=' "$LOG" | tr -d ' ')
echo "Total unique users (all time) : $TOTAL_USERS"
echo "Total app-opens logged        : $TOTAL_OPENS"
echo
echo "Daily active users (unique devices per day):"
# one line per unique (uid,day) pair, then count per day
grep -ohE 'uid=[^ ]+ day=[^ ]+' "$LOG" | sort -u \
  | grep -ohE 'day=[^ ]+' | sort | uniq -c \
  | awk '{printf "  %s : %s users\n", substr($2,5), $1}'
