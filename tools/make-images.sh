#!/bin/bash
# Re-draws the game's pictures with the game's own art, using Google Chrome in headless mode:
#  - icons and the link-preview picture into img/ (tools/make-images.html).
#    Run it after changing a sloth's look or the title.
#  - the README screenshots into img/screenshots/ (tools/make-screenshots.html plays short,
#    staged scenes of the real game). Run it after changing how the game looks.
# Needs macOS (sips) and Google Chrome.
cd "$(dirname "$0")/.." || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found."; exit 1; }
tmp=$(mktemp -d) || exit 1
mkdir -p img/screenshots
n=0
draw() { # draw <page.html> <#hash> <out.png>
  n=$((n + 1)) # a fresh Chrome profile each time (a reused one can hang while the last Chrome lets go of it)
  "$CHROME" --headless=new --user-data-dir="$tmp/profile$n" --disable-gpu --virtual-time-budget=10000 \
    --dump-dom "file://$PWD/tools/$1$2" 2>/dev/null > "$tmp/page.html"
  python3 -I -c '
import base64, re, sys
m = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", open(sys.argv[1]).read())
if not m: sys.exit("no picture came back for " + sys.argv[2])
open(sys.argv[2], "wb").write(base64.b64decode(m.group(1)))' "$tmp/page.html" "$3" || exit 1
}
draw make-images.html '#icon' img/icon-512.png
draw make-images.html '#share' img/share.png
sips -z 192 192 img/icon-512.png --out img/icon-192.png >/dev/null
sips -z 180 180 img/icon-512.png --out img/apple-touch-icon.png >/dev/null
sips -z 32 32 img/icon-512.png --out img/favicon-32.png >/dev/null
for shot in boss guns duel cave select; do
  draw make-screenshots.html "#$shot" "img/screenshots/$shot.png"
done
rm -rf "$tmp"
ls -l img img/screenshots
