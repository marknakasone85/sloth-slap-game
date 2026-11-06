#!/bin/bash
# Double-click this file in Finder to share The Sloth Slap Game on your home network.
# Anyone on the same Wi-Fi can then play it in their web browser.
# Only the game files are shared (read-only), and sharing stops by itself after 3 hours.
# Only use this on your own home Wi-Fi, not on public Wi-Fi (cafes, hotels, airports).

cd "$(dirname "$0")" || exit 1
python3 tools/share_server.py --port 8000 --hours 3
