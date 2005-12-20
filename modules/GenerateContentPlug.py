
from Plug import Plug
# Generator Plugs {{{
class GeneratorPlug(Plug): #{{{
	pass
#}}}
class StreamListGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", "text/plain")
		r.end_headers()

		r.wfile.write("Streams List\n")
		for stream in streamlist:
			r.wfile.write("%s\n" % (stream))
			r.wfile.write("   Clients: %d\n" % len(streamlist[stream].clients))
			r.wfile.write("   Current Song:\n")
			r.wfile.write("     Artist: %s\n" % streamlist[stream].song["artist"])
			r.wfile.write("     Album: %s\n" % streamlist[stream].song["album"])
			r.wfile.write("     Track: %s\n" % streamlist[stream].song["title"])
# }}}
class StreamControlGeneratorPlug(GeneratorPlug): #{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", "text/plain")
		r.end_headers()

		r.wfile.write("Streams List\n")
		for stream in streamlist:
			r.wfile.write("%s\n" % (stream))
			r.wfile.write("   Clients: %d\n" % len(streamlist[stream].clients))
			r.wfile.write("   Current Song:\n")
			r.wfile.write("     Artist: %s\n" % streamlist[stream].song["artist"])
			r.wfile.write("     Album: %s\n" % streamlist[stream].song["album"])
			r.wfile.write("     Track: %s\n" % streamlist[stream].song["title"])
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

		t = Template("templates/layout.html")
		list = []
		x = 0
		for stream in streamlist:
			print "Stream %s" % stream
			s = streamlist[stream]
			list.append({
				"baseattr:onclick": "stream_drilldown('%s')" % stream,
				"baseattr:class": x % 2 and "even" or "odd",
				"id:_streamname": stream,
				"id:_currentsong": "[%s] %s - %s" % (s.song["artist"], s.song["album"], s.song["title"]),
				"id:_clients": len(s.clients)
				})
			x += 1

		t.replicate("_streamentry", list)
		t.output(r.wfile)
# }}}
# }}}

from template import Template

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
	}

	def process(self):
		r = self.request
		generator = r.path.split("/")[2]
		if self.generators.has_key(generator):
			handler = self.generators[generator](r)
			handler.process()
		else:
			r.send_response(404)
			r.end_headers()


