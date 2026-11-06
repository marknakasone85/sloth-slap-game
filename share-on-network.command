#!/bin/bash
# Double-click this file in Finder to share The Sloth Slap Game on your home network.
# Anyone on the same Wi-Fi can then play it in their web browser.
# Keep the Terminal window open while people play; close it to stop sharing.

cd "$(dirname "$0")" || exit 1
PORT=8000
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

echo ""
echo "  The Sloth Slap Game is now shared on your home network!"
echo ""
if [ -n "$IP" ]; then
  echo "  On another computer or tablet on the same Wi-Fi, open this in a web browser:"
  echo ""
  echo "      http://$IP:$PORT"
else
  echo "  Could not find this Mac's network address. Is Wi-Fi connected?"
fi
echo ""
echo "  On this Mac you can also use:  http://localhost:$PORT"
echo ""
echo "  Keep this window open while people play. Close it (or press Ctrl+C) to stop sharing."
echo ""

python3 -m http.server "$PORT" --bind 0.0.0.0
