#!/usr/bin/env python3
"""Dev server. Identical to http.server except it forbids caching, so an edit
to a CSS or JS file always shows up on reload instead of silently not."""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (fmt % args):
            sys.stderr.write("404 %s\n" % (args[0] if args else ''))

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
    print(f'wordbreaker dev server: http://localhost:{port}')
    ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
