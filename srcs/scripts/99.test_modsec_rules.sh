#!/usr/bin/env bash
# test_modsec_rules.sh
# Battery of curl tests to exercise your ModSecurity custom rules + CRS.
#
# Assumptions:
# - WAF/Nginx reachable at http://localhost (port 80) unless $HOST overrides
# - Endpoints present or harmless if 404: /, /healthz, /ping, /static/app.js,
#   /api/, /api/upload, /api/login, /api/item
#
# WARNING: This script creates temporary files (~26 MB) for upload/size tests.
#
# To launch with a different host/port:
# HOST=http://127.0.0.1:8080 DEMO_RULE_ID=900901 bash test_modsec_rules.sh

set -euo pipefail

HOST=${HOST:-http://localhost}
DEMO_RULE_ID=${DEMO_RULE_ID:-900901}   # if you kept 999999, set DEMO_RULE_ID=999999
TMPDIR=$(mktemp -d)
CURL='curl -s -o /dev/null -w "%{http_code}"'

echo "Temporary dir: $TMPDIR"
cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

###############################################################################
# 1) Demo block: keyword 'malicious' (id ${DEMO_RULE_ID})
###############################################################################
echo
echo "1) Demo block keyword (should be 403) — rule ${DEMO_RULE_ID}"
resp=$(eval $CURL "$HOST/?q=malicious")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

###############################################################################
# 2) Health & ping DetectionOnly (id 900110): should NOT be blocked
###############################################################################
echo
echo "2) Health (/healthz) and ping (/ping) — should NOT be blocked (DetectionOnly)"
for path in /healthz /ping; do
  resp=$(eval $CURL "$HOST${path}")
  echo " -> $path -> HTTP $resp"
  [ "$resp" = "403" ] && echo "FAIL: blocked" || echo "PASS"
done

###############################################################################
# 3) Static asset — DetectionOnly (not blocked even if CRS would flag)
###############################################################################
echo
echo "3) Static asset (/static/app.js) — expected not blocked"
resp=$(eval $CURL "$HOST/static/app.js")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "FAIL: blocked" || echo "PASS"

###############################################################################
# 4) CORS preflight (OPTIONS) — should be allowed
###############################################################################
echo
echo "4) CORS preflight (OPTIONS) — should be allowed"
resp=$(eval $CURL -X OPTIONS -H "Origin: http://example.com" -H "Access-Control-Request-Method: POST" "$HOST/")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "FAIL: blocked" || echo "PASS"

###############################################################################
# 5) API strict Content-Type — POST text/plain → expect 415 if enforced
###############################################################################
echo
echo "5) API Content-Type enforcement — POST text/plain to /api/test"
resp=$(eval $CURL -X POST -H "Content-Type: text/plain" -d '{"x":1}' "$HOST/api/test")
echo " -> HTTP $resp"
[ "$resp" = "415" ] && echo "PASS (415)" || echo "NOTE: not enforced (status $resp)"

###############################################################################
# 6) Upload guard — allowed small multipart upload to /api/upload
###############################################################################
echo
echo "6) Upload guard — allow small multipart upload"
echo "hello" > "$TMPDIR/small.txt"
resp=$(eval $CURL -X POST -F "file=@$TMPDIR/small.txt" "$HOST/api/upload")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "FAIL: blocked" || echo "PASS"

###############################################################################
# 7) Upload guard — block dangerous extensions & double extensions
###############################################################################
echo
echo "7) Upload guard — block dangerous extensions"
echo "<?php phpinfo();" > "$TMPDIR/evil.php"
resp=$(eval $CURL -X POST -F "file=@$TMPDIR/evil.php" "$HOST/api/upload")
echo " -> evil.php -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

echo "not really jpeg" > "$TMPDIR/image.jpg.php"
resp=$(eval $CURL -X POST -F "file=@$TMPDIR/image.jpg.php" "$HOST/api/upload")
echo " -> image.jpg.php -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

###############################################################################
# 8) Large single body (urlencoded) — expect 413
###############################################################################
echo
echo "8) Large single request body — expect 413"
dd if=/dev/zero of="$TMPDIR/big1.bin" bs=1M count=13 status=none
resp=$(eval $CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/big1.bin" "$HOST/")
echo " -> HTTP $resp"
[ "$resp" = "413" ] && echo "PASS" || echo "NOTE: expected 413, got $resp"

###############################################################################
# 9) Multipart combined size > limit — expect 413
###############################################################################
echo
echo "9) Multipart combined size — expect 413"
dd if=/dev/zero of="$TMPDIR/fileA.bin" bs=1M count=8 status=none
dd if=/dev/zero of="$TMPDIR/fileB.bin" bs=1M count=8 status=none
resp=$(eval $CURL -X POST -F "a=@$TMPDIR/fileA.bin" -F "b=@$TMPDIR/fileB.bin" "$HOST/api/upload")
echo " -> HTTP $resp"
[ "$resp" = "413" ] && echo "PASS" || echo "NOTE: expected 413, got $resp"

###############################################################################
# 10) Too many args (>256) — expect 413
###############################################################################
echo
echo "10) Too many args (>256) — expect 413"
qs=$(python3 - <<'PY'
print("&".join([f"a{i}=1" for i in range(300)]))
PY
)
resp=$(eval $CURL "$HOST/?$qs")
echo " -> HTTP $resp"
[ "$resp" = "413" ] && echo "PASS" || echo "NOTE: expected 413, got $resp"

###############################################################################
# 11) Arg name too long (>50) — expect 413
###############################################################################
echo
echo "11) Arg name too long — expect 413"
longname=$(python3 - <<'PY'
print("n"+("x"*60))
PY
)
resp=$(eval $CURL "$HOST/?$longname=1")
echo " -> HTTP $resp"
[ "$resp" = "413" ] && echo "PASS" || echo "NOTE: expected 413, got $resp"

###############################################################################
# 12) Arg value too long (>64k) — expect 413
###############################################################################
echo
echo "12) Arg value too long — expect 413"
python3 - <<'PY' > "$TMPDIR/longvalue.txt"
print("v=" + "A"*70000)
PY
resp=$(eval $CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/longvalue.txt" "$HOST/")
echo " -> HTTP $resp"
[ "$resp" = "413" ] && echo "PASS" || echo "NOTE: expected 413, got $resp"

###############################################################################
# 13) CSRF — POST to /api/item WITHOUT X-CSRF-Token → expect 403
###############################################################################
echo
echo "13) CSRF — expect 403"
resp=$(eval $CURL -X POST -H "Content-Type: application/json" -d '{"test":1}' "$HOST/api/item")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp)"

###############################################################################
# 14) Login rate-limit — send 12 POSTs quickly, expect >=1 HTTP 429
###############################################################################
echo
echo "14) Login rate-limit — 12 POSTs to /api/login"
count_429=0
for i in $(seq 1 12); do
  st=$(eval $CURL -X POST "$HOST/api/login")
  printf "%s " "$st"
  [ "$st" = "429" ] && count_429=$((count_429+1)) || true
done
echo
[ "$count_429" -gt 0 ] && echo "PASS: observed $count_429 responses with 429" || echo "NOTE: no 429 observed"

###############################################################################
# 15) Host header sanity — invalid Host should be 400
###############################################################################
echo
echo "15) Host header sanity — invalid Host should be 400"
resp=$(eval $CURL -H "Host: evil.com" "$HOST/")
echo " -> HTTP $resp"
[ "$resp" = "400" ] && echo "PASS" || echo "NOTE: expected 400, got $resp"

###############################################################################
# 16) SSRF signals — metadata IP and file:// scheme — expect 403
###############################################################################
echo
echo "16) SSRF checks — expect 403"
resp=$(eval $CURL "$HOST/?u=http://169.254.169.254/latest/meta-data")
echo " -> metadata IP -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

resp=$(eval $CURL "$HOST/?u=file:///etc/passwd")
echo " -> file:// scheme -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

###############################################################################
# 17) LFI quick win — path traversal to /etc/passwd — expect 403
###############################################################################
echo
echo "17) LFI quick win — expect 403"
resp=$(eval $CURL "$HOST/?path=../../etc/passwd")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS" || echo "NOTE: expected 403, got $resp"

###############################################################################
# 18) JSON responses in /api — enforce 406 if policy enabled
###############################################################################
echo
echo "18) JSON response enforcement — expect 406 if enabled"
resp=$(eval $CURL "$HOST/api/")
echo " -> HTTP $resp"
[ "$resp" = "406" ] && echo "PASS (406)" || echo "NOTE: JSON response enforcement not active (status $resp)"

echo
echo "All tests done. Cleaning up."

###############################################################################
# 19) Methods in '/' — POST/PUT/DELETE should be 405
###############################################################################
echo
echo "19) Methods in '/' — POST/PUT/DELETE -> expect 405"
for m in POST PUT DELETE; do
  resp=$(eval $CURL -X "$m" "$HOST/")
  echo " -> $m / => HTTP $resp"
  [ "$resp" = "405" ] && echo "PASS" || echo "NOTE: expected 405, got $resp"
done

###############################################################################
# 20) Methods in '/api' (default) — PUT/DELETE should be 405
###############################################################################
echo
echo "20) Methods in '/api' — PUT/DELETE -> expect 405"
for m in PUT DELETE; do
  resp=$(eval $CURL -X "$m" -H "Content-Type: application/json" "$HOST/api/test")
  echo " -> $m /api/test => HTTP $resp"
  [ "$resp" = "405" ] && echo "PASS" || echo "NOTE: expected 405, got $resp"
done

###############################################################################
# 21) Override: /api/profiles — PUT/DELETE should NOT be blocked by WAF
###############################################################################
echo
echo "21) Override /api/profiles — PUT/DELETE should pass-through (not 405/403)"
for m in PUT DELETE; do
  resp=$(eval $CURL -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST/api/profiles")
  echo " -> $m /api/profiles => HTTP $resp"
  if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
    echo "NOTE: expected pass-through (not 405/403), got $resp"
  else
    echo "PASS (not blocked by WAF)"
  fi
done

###############################################################################
# 22) Override: /api/items and /api/items/123 — PUT/DELETE should NOT be blocked
###############################################################################
echo
echo "22) Override /api/items[/123] — PUT/DELETE should pass-through (not 405/403)"
for endpoint in "/api/items" "/api/items/123"; do
  for m in PUT DELETE; do
    resp=$(eval $CURL -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST$endpoint")
    echo " -> $m $endpoint => HTTP $resp"
    if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
      echo "NOTE: expected pass-through (not 405/403), got $resp"
    else
      echo "PASS (not blocked by WAF)"
    fi
  done
done

echo
echo "All tests done. Cleaning up."