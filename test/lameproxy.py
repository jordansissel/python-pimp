#!/usr/local/bin/python

from threading import Thread, Event
import urllib;
import SocketServer, BaseHTTPServer
import os
import select

class LAMEProxy:
	def __init__(self, port=9001):
		self.port = port
		self.server = SocketServer.ThreadingTCPServer(('', self.port), self.RequestHandler)

	class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
		def do_GET(self):
			DIE=0
			self.send_response(200)
			self.send_header("Content-type", "audio/mpeg");
			self.end_headers();

			(lamein, lameout) = os.popen2("lame --mp3input -m m --abr 128 -b 64 - -");
			u = urllib.urlopen("http://kenya.csh.rit.edu:8000%s" % self.path)
			buf = u.read(4096)
			while len(buf) > 0:
				if DIE:
					break
				#print "pimp: %d bytes" % len(buf)
				lamein.write(buf);
				while 1:
					data = select.select([lameout.fileno()], [],[],.1);
					if len(data[0]) == 0:
						break
					mp3 = lameout.read(4096)
					try:
						self.wfile.write(mp3)
					except:
						DIE=1
						try:
							lameout.close()
						except:
							print "Error closing lameout"
						try:
							lamein.close()
						except:
							print "Error closing lamein"
				buf = u.read(4096)

if __name__ == "__main__":
	f = LAMEProxy()
	f.server.serve_forever()
