
class Plug:
	content_type = {
		"css": "text/css",
		"html": "application/xhtml+xml",
		"js": "text/javascript",
		"jpg": "image/jpeg",
		"png": "image/png",
	}

	def __init__(self,request):
		self.request = request
	
	def sendfile(self, src):
		if not os.path.isfile(src):
			print "No such file: %s" % src
			return 0

		f = open(src)
		data = f.read(4096)
		while data:
			self.request.wfile.write(data)
			data = f.read(4096)

