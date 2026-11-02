from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


assets = Path(__file__).resolve().parents[1] / "dist"
handler = partial(SimpleHTTPRequestHandler, directory=str(assets))
port = int(os.environ.get("PORT", "4173"))

with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
    print(f"\n  Local: http://localhost:{server.server_port}/", flush=True)
    print("  Press Ctrl+C to stop.\n", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPreview server stopped.", flush=True)
