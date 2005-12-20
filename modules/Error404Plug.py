
from Plug import Plug
class Error404Plug(Plug):
	def process(self):
		r = self.request
		r.send_response(404)
		r.send_header("Content-type", "text/html")
		r.end_headers()
		
		if r.command == "GET":
			self.sendfile("static/404.html")

