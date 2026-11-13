#!/bin/bash
# Re-draws the game's icons and link-preview picture into img/ with the game's own art
# (tools/make-images.html), using Google Chrome in headless mode. Run it after changing a
# sloth's look or the title. Needs macOS (sips) and Google Chrome.
cd "$(dirname "$0")/.." || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found."; exit 1; }
tmp=$(mktemp -d) || exit 1
mkdir -p img
draw() { # draw <#icon|#share> <out.png>
  "$CHROME" --headless=new --user-data-dir="$tmp/profile" --disable-gpu --virtual-time-budget=3000 \
    --dump-dom "file://$PWD/tools/make-images.html$1" 2>/dev/null > "$tmp/page.html"
  python3 -I -c '
import base64, re, sys
m = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", open(sys.argv[1]).read())
if not m: sys.exit("no picture came back from make-images.html")
open(sys.argv[2], "wb").write(base64.b64decode(m.group(1)))' "$tmp/page.html" "$2" || exit 1
}
draw '#icon' img/icon-512.png
draw '#share' img/share.png
sips -z 192 192 img/icon-512.png --out img/icon-192.png >/dev/null
sips -z 180 180 img/icon-512.png --out img/apple-touch-icon.png >/dev/null
sips -z 32 32 img/icon-512.png --out img/favicon-32.png >/dev/null
rm -rf "$tmp"
ls -l img
