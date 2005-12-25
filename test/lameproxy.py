#!/usr/local/bin/python

from threading import Thread, Event
import urllib;
import SocketServer, BaseHTTPServer
import os
import select

class LAMEProxy:
	def __init__(self, port=9002):
		self.port = port
		self.server = SocketServer.ThreadingTCPServer(('', self.port), self.RequestHandler)

	class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
		def do_GET(self):
			self.send_response(200)
			self.send_header("Content-type", "audio/mpeg");
			self.end_headers();

			(lamein, lameout) = os.popen2("lame --mp3input -m m --abr 128 -b 64 - -");
			u = urllib.urlopen("http://kenya.csh.rit.edu:8000%s" % self.path)
			buf = u.read(4096)
			while len(buf) > 0:
				#print "pimp: %d bytes" % len(buf)
				lamein.write(buf);
				while 1:
					data = select.select([lameout.fileno()], [],[],.1);
					if len(data[0]) == 0:
						break
					mp3 = lameout.read(4096)
					self.wfile.write(mp3)
					#print "lame: %d bytes" % len(mp3)
				buf = u.read(4096)


if __name__ == "__main__":
	f = LAMEProxy()
	f.server.serve_forever()
