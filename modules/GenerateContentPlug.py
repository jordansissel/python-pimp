
from Plug import Plug
from template import Template
class GeneratorPlug(Plug): #{{{
	pass
#}}}
class StreamListGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", "text/plain")
		r.end_headers()
		sl = self.musicdb.streamlist

		r.wfile.write("Streams List\n")
		for stream in sl:
			r.wfile.write("%s\n" % (stream))
			r.wfile.write("   Clients: %d\n" % len(sl[stream].clients))
			r.wfile.write("   Current Song:\n")
			r.wfile.write("     Artist: %s\n" % sl[stream].song["artist"])
			r.wfile.write("     Album: %s\n" % sl[stream].song["album"])
			r.wfile.write("     Track: %s\n" % sl[stream].song["title"])
# }}}
class StreamControlGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", "text/plain")
		r.end_headers()

		sl = self.musicdb.streamlist

		r.wfile.write("Streams List\n")
		for stream in sl:
			r.wfile.write("%s\n" % (stream))
			r.wfile.write("   Clients: %d\n" % len(sl[stream].clients))
			r.wfile.write("   Current Song:\n")
			r.wfile.write("     Artist: %s\n" % sl[stream].song["artist"])
			r.wfile.write("     Album: %s\n" % sl[stream].song["album"])
			r.wfile.write("     Track: %s\n" % sl[stream].song["title"])
# }}}
class SearchPageGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", "text/html")
		r.end_headers()

		cgi = CGIParams(r)

		#r.wfile.write("tv= %s\n" % cgi.params["test"])
		r.wfile.write("""
<html>
<body>
<form method="GET">
	<input type="text" name="test">
	<input type="text" name="test">
	<input type="text" name="test">
	<input type="text" name="test">
	<input type="submit">
</form>
</body>
</html>
""")
# }}}
class StreamListPageGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", Plug.content_type["html"])
		r.end_headers()

		self.sendfile("templates/layout.html")
# }}}

class StreamInfoPageGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", Plug.content_type["html"])
		#r.send_header("Content-type", "text/html")
		r.end_headers()

		#t = Template("templates/streaminfo.html")
		self.sendfile("templates/streaminfo.html")
# }}}


class GenerateContentPlug(Plug):
	"""
		This class is an abstraction layer for generated content.  Generated
		content has the /dynamic/ namespace, but generated content is so unique
		that each generator module gets it's own child namespace
	"""

	generators = {
		"search": SearchPageGeneratorPlug,
		"streamlist": StreamListPageGeneratorPlug,
		"streamlist.txt": StreamListGeneratorPlug,

		"streaminfo": StreamInfoPageGeneratorPlug,
	}

	def process(self):
		r = self.request
		generator = r.path.split("/")[2].split("?")[0]
		
		if self.generators.has_key(generator):
			handler = self.generators[generator](r)
			handler.process()
		else:
			r.send_response(404)
			r.end_headers()


