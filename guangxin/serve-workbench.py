from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
os.chdir(Path(__file__).parent)
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0]=='/': self.path='/ai-workbench.html'
        super().do_GET()
ThreadingHTTPServer(('0.0.0.0',8787),Handler).serve_forever()
