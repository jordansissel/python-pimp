
from Plug import Plug
class RedirectPlug(Plug):
	def process(self):
		r = self.request
		r.send_response(302)
		r.send_header("Location","/control")
		r.end_headers()

