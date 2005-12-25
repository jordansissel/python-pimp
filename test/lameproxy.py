#!/usr/local/bin/python

from threading import Thread, Event
import urllib;
import SocketServer, BaseHTTPServer
import os

class LAMEProxy():
	def __init__(self, port=9000):
		self.port = port
		self.server = SocketServer.ThreadingTCPServer(('', self.port), self.RequestHandler)

	class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
		def do_GET(self):
			self.send_header("Content-type", "audio/mpeg");
			self.send_response(200)
			self.end_headers();

			#(in, out) popen2("lame --mp3input -m m --abr 128 -b 64");
			#buf = self.rfile.read(4096)
			print r.path
