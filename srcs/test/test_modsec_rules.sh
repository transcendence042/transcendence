#!/usr/bin/env bash
# test_modsec_rules.sh
# Runs a battery of curl tests to exercise ModSecurity rules we added.
#
# Assumptions:
# - WAF/Nginx available at http://localhost (port 80)
# - Endpoints: /, /healthz, /ping, /static/app.js, /api/, /api/upload, /api/login, /api/item
# - Adjust HOST variable below if different (http://hostname:port)
#
# WARNING: This script will create temporary files (~13MB) to test upload/size rules.
# Remove or change sizes if disk/bandwidth is constrained.

set -euo pipefail
HOST=${HOST:-http://localhost}
TMPDIR=$(mktemp -d)
CURL="curl -s -o /dev/null -w \"%{http_code}\""

echo "Temporary dir: $TMPDIR"
cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

echo
echo "1) Demo block (should return 403) — rule 999999"
resp=$($CURL "$HOST/?q=malicious")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS: demo block" || echo "FAIL: demo block (expected 403)"

echo
echo "2) Health (/healthz) and ping (/ping) (should NOT be blocked) — rules 900121/900122"
for path in /healthz /ping; do
  resp=$($CURL "$HOST${path}")
  echo " -> $path -> HTTP $resp"
  if [ "$resp" = "403" ]; then
    echo "FAIL: $path blocked (expected not blocked)"
  else
    echo "PASS: $path ok (not blocked)"
  fi
done

echo
echo "3) Static asset (/static/app.js) — DetectionOnly expected (not blocked)"
resp=$($CURL "$HOST/static/app.js")
echo " -> HTTP $resp"
if [ "$resp" = "403" ]; then echo "FAIL: static asset blocked"; else echo "PASS: static asset served/allowed"; fi

echo
echo "4) CORS preflight (OPTIONS) — should not be blocked (900123)"
resp=$($CURL -X OPTIONS -H "Origin: http://example.com" -H "Access-Control-Request-Method: POST" "$HOST/")
echo " -> HTTP $resp"
if [ "$resp" = "403" ]; then echo "FAIL: OPTIONS preflight blocked"; else echo "PASS: OPTIONS preflight allowed"; fi

echo
echo "5) API content type enforcement (900210) — POST with text/plain should get 415"
resp=$($CURL -X POST -H "Content-Type: text/plain" -d '{"x":1}' "$HOST/api/test" )
echo " -> HTTP $resp"
[ "$resp" = "415" ] && echo "PASS: API content-type enforced (415)" || echo "NOTE: API content-type not enforced (status $resp)"

echo
echo "6) API upload whitelist (/api/upload) (900211) — multipart allowed; we'll send a small file"
# create a small test file
echo "hello" > "$TMPDIR/small.txt"
resp=$($CURL -X POST -F "file=@$TMPDIR/small.txt" "$HOST/api/upload")
echo " -> HTTP $resp"
if [ "$resp" = "403" ]; then echo "FAIL: upload blocked (expected allowed)"; else echo "PASS: upload request returned $resp"; fi

echo
echo "7) Create large test files to exercise max_file_size and combined_file_sizes (uses ~26MB)"
# file that exceeds single max (13MB)
dd if=/dev/zero of="$TMPDIR/big1.bin" bs=1M count=13 status=none
# two files to exceed combined (2x7MB = 14MB). We'll make them 8MB each.
dd if=/dev/zero of="$TMPDIR/fileA.bin" bs=1M count=8 status=none
dd if=/dev/zero of="$TMPDIR/fileB.bin" bs=1M count=8 status=none

echo "8) POST with very large single body (URLENCODED/Request body length) — expect 413 (900235 or 900236)"
# Send as raw POST body to root (URL-encoded check path)
resp=$($CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/big1.bin" "$HOST/")
echo " -> HTTP $resp"
if [ "$resp" = "413" ]; then echo "PASS: large single request blocked (413)"; else echo "NOTE: large single request not blocked (status $resp)"; fi

echo
echo "9) Multipart combined files test — expect 413 if combined size limit enforced"
resp=$($CURL -X POST -F "a=@$TMPDIR/fileA.bin" -F "b=@$TMPDIR/fileB.bin" "$HOST/api/upload")
echo " -> HTTP $resp"
if [ "$resp" = "413" ]; then echo "PASS: combined multipart size blocked (413)"; else echo "NOTE: combined multipart size not blocked (status $resp)"; fi

echo
echo "10) Too many args (900231) — generate 300 args; expect 413 if threshold=256"
# generate query string with 300 params
qs=$(python3 - <<'PY'
print("&".join([f"a{i}=1" for i in range(300)]))
PY
)
resp=$($CURL "$HOST/?$qs")
echo " -> HTTP $resp"
if [ "$resp" = "413" ]; then echo "PASS: too many args blocked (413)"; else echo "NOTE: too many args not blocked (status $resp)"; fi

echo
echo "11) Argument name too long (900232) — create a very long param name"
longname=$(python3 - <<'PY'
print("n"+("x"*60))
PY
)
resp=$($CURL "$HOST/?$longname=1")
echo " -> HTTP $resp"
if [ "$resp" = "413" ]; then echo "PASS: arg name length blocked (413)"; else echo "NOTE: arg name length not blocked (status $resp)"; fi

echo
echo "12) Argument value too long (900233) — value length > 64k"
# generate >64k payload
python3 - <<'PY' > "$TMPDIR/longvalue.txt"
print("v=" + "A"*70000)
PY
resp=$($CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/longvalue.txt" "$HOST/")
echo " -> HTTP $resp"
if [ "$resp" = "413" ]; then echo "PASS: arg value too long blocked (413)"; else echo "NOTE: arg value too long not blocked (status $resp)"; fi

echo
echo "13) Demo CSRF check (900500) — POST to /api/item without X-CSRF-Token -> expect 403"
resp=$($CURL -X POST -H "Content-Type: application/json" -d '{"test":1}' "$HOST/api/item")
echo " -> HTTP $resp"
if [ "$resp" = "403" ]; then echo "PASS: CSRF rule blocked (403)"; else echo "NOTE: CSRF rule not blocking (status $resp)"; fi

echo
echo "14) Demo login rate-limit (900401/900402) — send 12 quick requests, expect >=1 429"
echo "Sending 12 requests to /api/login..."
count_429=0
for i in $(seq 1 12); do
  st=$($CURL "$HOST/api/login")
  echo -n "$st "
  if [ "$st" = "429" ]; then count_429=$((count_429+1)); fi
done
echo
if [ "$count_429" -gt 0 ]; then echo "PASS: observed $count_429 429 responses (rate-limit)"; else echo "NOTE: no 429 observed (rate-limit may not be enforced)"; fi

echo
echo "15) Demo block keyword via header matching (999999) - header contains 'malicious'"
resp=$($CURL -H "X-Test: malicious" "$HOST/")
echo " -> HTTP $resp"
[ "$resp" = "403" ] && echo "PASS: header demo block (403)" || echo "NOTE: header demo block not triggered (status $resp)"

echo
echo "16) Paranoia Level check — we cannot directly 'see' the TX variables, but if you configured logging,"
echo "    check WAF logs (modsec audit and error logs) to see 'Paranoia Level set to PL1' messages."
echo
echo "All tests done. Cleanup temporary files."
