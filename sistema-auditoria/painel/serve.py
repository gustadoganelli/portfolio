# Servidor estatico simples para o painel (desenvolvimento).
# Envia Cache-Control: no-store para evitar cache do navegador.
import http.server
import os
import socketserver

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "public"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


PORT = 5174
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Painel em http://localhost:{PORT}")
    httpd.serve_forever()
