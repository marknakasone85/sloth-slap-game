#!/bin/bash
# Runs the automated tests for The Sloth Slap Game with macOS's built-in JavaScript engine
# (no browser or installs needed).
#   tools/run-tests.sh          quick run (a few minutes)
#   tools/run-tests.sh --full   also plays every sloth on every map (much longer)
cd "$(dirname "$0")/.." || exit 1
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
[ -x "$JSC" ] || { echo "JavaScriptCore (jsc) not found - these tests need macOS."; exit 1; }

echo "Syntax check of every game file..."
bad=0
for f in $(find js -name '*.js'); do
  out=$("$JSC" -e "try { new Function(readFile('$f')); } catch (e) { print('$f: ' + e); }")
  [ -n "$out" ] && { echo "  $out"; bad=1; }
done
[ $bad -eq 0 ] && echo "  all files OK"

full=""
[ "$1" = "--full" ] && full="var FULL_RUN = true;"
failed=0
for t in menus touch battle coop solo; do
  echo ""
  echo "== $t =="
  out=$("$JSC" -e "$full" tools/tests/harness.js "tools/tests/test_$t.js" 2>&1)
  echo "$out"
  echo "$out" | grep -qE "FAIL|Exception|Error:" && failed=1
done
echo ""
if [ $failed -eq 0 ] && [ $bad -eq 0 ]; then echo "ALL TESTS PASSED"; else echo "SOME TESTS FAILED"; exit 1; fi
