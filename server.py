"""Dependency-free loopback-only DM app server."""
import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from model import clean_state, load_state, save_state

ROOT = Path(__file__).resolve().parent
FILES = {"/": ("index.html", "text/html"), "/player": ("player.html", "text/html"),
         "/styles.css": ("styles.css", "text/css"), "/dice.js": ("dice.js", "text/javascript"),
         "/app.js": ("app.js", "text/javascript"), "/player.js": ("player.js", "text/javascript")}


class AppServer(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, addr, handler, state_path=None):
        super().__init__(addr, handler)
        self.state_path = state_path
        self.state = load_state(state_path)
        self.revision = 1
        self.lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def _respond(self, status, content, kind="application/json; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            with self.server.lock:
                result = {**self.server.state, "revision": self.server.revision}
            return self._respond(200, json.dumps(result).encode())
        if path not in FILES:
            return self._respond(404, b'{"error":"Not found"}')
        filename, mimetype = FILES[path]
        content = (ROOT / filename).read_bytes()
        return self._respond(200, content, mimetype + "; charset=utf-8")

    def do_POST(self):
        if urlparse(self.path).path != "/api/state":
            return self._respond(404, b'{"error":"Not found"}')
        origin = self.headers.get("Origin", "")
        if origin and origin != "http://127.0.0.1:8765" and origin != f"http://127.0.0.1:{self.server.server_port}":
            return self._respond(403, b'{"error":"Invalid origin"}')
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            return self._respond(415, b'{"error":"Expected JSON"}')
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 32768:
                raise ValueError("Invalid request size")
            state = clean_state(json.loads(self.rfile.read(length)))
            with self.server.lock:
                save_state(state, self.server.state_path)
                self.server.state = state
                self.server.revision += 1
                revision = self.server.revision
            self._respond(200, json.dumps({"ok": True, "revision": revision}).encode())
        except (ValueError, OSError, UnicodeDecodeError) as exc:
            self._respond(400, json.dumps({"error": str(exc)}).encode())


def main():
    address = "http://127.0.0.1:8765"
    try:
        server = AppServer(("127.0.0.1", 8765), Handler)
    except OSError as exc:
        raise SystemExit(f"Unable to start server on port 8765: {exc}")
    print(f"DND Control Station: {address}")
    print("To stop: Ctrl+C. Session data stays on this laptop.")
    threading.Timer(0.5, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
