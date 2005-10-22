#!/usr/local/bin/python
import SocketServer, BaseHTTPServer
from threading import Thread,Event
import Queue

import signal
import sys
import time

events = Queue.Queue()
class Pimp:

	def __init__(self):
		self.control = Pimp.ControlServer()
		self.threads = [self.control]

	def start(self):
		self.control.start()

		# Wait for threads to die
		for a in self.threads:
			a.join()

	def sighandler(self):
		print "SIGINT"
		for a in self.threads:
			a.done = True

	class ControlServer(Thread):
		""" Happy control server. presents a web interface to the user and uses
		ajax+xmlrpc to communicate """

		def __init__(self):
			self._stopevent = Event()
			self._sleepperiod = 1.0
			self.port = 8000
			self.done = False
			self.server = SocketServer.ThreadingTCPServer(('', self.port), self.RequestHandler)
			Thread.__init__(self,name="Pimp Control Server")

		def run(self):
			print "ControlServer starting..."
			while not self.done:
				print "Finished? %s" % self.done
				self.server.handle_request()

		def join(self,timeout=None):
			self._stopevent.set()
			Thread.join(self, timeout)

		class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
			""" HTTP connection handler """

			def do_POST(self):
				""" This should only be hit via xmlrpc calls from the frontend """
				self.send_response(404);
				self.end_headers()
				self.wfile.write("Hello")

			def do_GET(self):
				req = Pimp.ControlWebInterface(self)
				req.process()

if __name__ == '__main__':
	p = Pimp()
	p.start()
