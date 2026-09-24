#!/bin/bash
# Polls GitHub OAuth Device Flow until the user authorizes (or it expires).
# Saves the resulting token to /home/z/.ghtoken (outside the repo, mode 600).
# Usage: poll-github-device.sh <device_code> [interval]

CLIENT_ID="178c6fc778ccc68e1d6a"   # public GitHub CLI OAuth client (device flow)
DEVICE_CODE="$1"
INTERVAL="${2:-5}"
OUT="/home/z/.ghtoken"
STATUS="/home/z/.ghtoken.status"

cleanup() { rm -f /tmp/.gh-poll.$$ 2>/dev/null; }
trap cleanup EXIT

START=$(date +%s)
while true; do
  sleep "$INTERVAL"
  RESP=$(curl -s -X POST https://github.com/login/oauth/access_token \
    -H "Accept: application/json" \
    -d "client_id=${CLIENT_ID}&device_code=${DEVICE_CODE}&grant_type=urn:ietf:params:oauth:grant-type:device_code")

  if printf '%s' "$RESP" | rg -q '"access_token"'; then
    TOKEN=$(printf '%s' "$RESP" | rg -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
      umask 077
      printf '%s' "$TOKEN" > "$OUT"
      echo "SUCCESS $(date -u +%FT%TZ)" > "$STATUS"
      exit 0
    fi
  fi

  ERR=$(printf '%s' "$RESP" | rg -o '"error":"[^"]*"' | head -1 | cut -d'"' -f4)
  case "$ERR" in
    authorization_pending) continue ;;
    slow_down) INTERVAL=$((INTERVAL + 5)); continue ;;
    expired_token)      echo "EXPIRED $(date -u +%FT%TZ)" > "$STATUS"; exit 1 ;;
    unsupported_grant_type|incorrect_device_code|access_denied)
                        echo "$ERR $(date -u +%FT%TZ)" > "$STATUS"; exit 1 ;;
    "")                 echo "UNKNOWN_RESPONSE: $RESP" > "$STATUS"; exit 1 ;;
    *)                  echo "ERROR:$ERR $(date -u +%FT%TZ)" > "$STATUS"; exit 1 ;;
  esac

  NOW=$(date +%s)
  if [ $((NOW - START)) -gt 1200 ]; then
    echo "TIMEOUT $(date -u +%FT%TZ)" > "$STATUS"
    exit 1
  fi
done
