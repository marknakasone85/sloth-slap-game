"""Locked-down web server for sharing The Sloth Slap Game on a home network.

Security choices:
  * Only the game itself is served: /index.html, /css/... and /js/...
    Everything else (hidden files, the .git backup history, settings, README,
    scripts) answers "404 Not Found", and folders are never listed.
  * Read-only: only GET/HEAD requests are supported, so nobody can upload or
    change files.
  * Stops by itself after a few hours so it is never left running by accident.

Usage:  python3 tools/share_server.py [--port 8000] [--hours 3] [--local]
        (--local = only this Mac can connect, for testing)
"""
import argparse
import http.server
import os
import posixpath
import socket
import sys
import threading
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED_PREFIXES = ("/css/", "/js/")


def allowed(path):
    if path == "/index.html":
        return True
    if not path.startswith(ALLOWED_PREFIXES):
        return False
    # no hidden files or folders anywhere in the path
    return not any(part.startswith(".") for part in path.split("/") if part)


class GameOnlyHandler(http.server.SimpleHTTPRequestHandler):
    server_version = "SlothSlap"
    sys_version = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        raw = urllib.parse.urlsplit(self.path).path
        path = posixpath.normpath(urllib.parse.unquote(raw))  # collapses any "../"
        if path in ("/", "."):
            path = "/index.html"
        full = self.translate_path(path)
        if not allowed(path) or not os.path.isfile(full):
            self.send_error(404, "Not Found")
            return None
        self.path = path
        return super().send_head()

    def list_directory(self, path):  # never show folder contents
        self.send_error(404, "Not Found")
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")  # players always get the newest version
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the window quiet


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no traffic is sent; just picks the Wi-Fi address
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--hours", type=float, default=3)
    ap.add_argument("--local", action="store_true")
    args = ap.parse_args()

    host = "127.0.0.1" if args.local else "0.0.0.0"
    try:
        server = http.server.ThreadingHTTPServer((host, args.port), GameOnlyHandler)
    except OSError:
        print(f"\n  Port {args.port} is busy. Is the game already being shared in another window?\n")
        sys.exit(1)

    ip = None if args.local else lan_ip()
    print("\n  The Sloth Slap Game is now shared on your home network!\n")
    if ip:
        print("  On another computer or tablet on the same Wi-Fi, open this in a web browser:\n")
        print(f"      http://{ip}:{args.port}\n")
    print(f"  On this Mac:  http://localhost:{args.port}\n")
    print("  Only the game files are shared (read-only).")
    print(f"  Sharing stops automatically after {args.hours:g} hours.")
    print("  Close this window (or press Ctrl+C) to stop sharing now.\n")
    sys.stdout.flush()

    timer = threading.Timer(args.hours * 3600, server.shutdown)
    timer.daemon = True
    timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        print("\n  Sharing stopped.\n")


if __name__ == "__main__":
    main()
