
from SendContentPlug import SendContentPlug
from Plug import Plug
class ControlWebPlug(Plug):
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", SendContentPlug.content_type["html"])
		r.end_headers()

		if r.command == "GET":
			self.sendfile("static/index.html")

