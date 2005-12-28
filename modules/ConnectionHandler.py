
from threading import Thread, Event
import SocketServer, BaseHTTPServer

from Plug import Plug
from RedirectPlug import RedirectPlug
from ControlWebPlug import ControlWebPlug
from ControlXMLRPCPlug import ControlXMLRPCPlug
from StreamPlug import StreamPlug
from Error404Plug import Error404Plug
from SendContentPlug import SendContentPlug
from GenerateContentPlug import GenerateContentPlug
from JSONRPCPlug import JSONRPCPlug

from MusicDB import MusicDB

class ConnectionHandler(Thread):
	"""Handle connections from clients. Pass them off to the appropriate handler """

	def __init__(self, port=8000):
		self.port = port
		self.done = False
		self.server = SocketServer.ThreadingTCPServer(('', self.port),
																	 self.RequestHandler)
		Thread.__init__(self,name="ConnectionHandler")

	def run(self):
		while not self.done:
			self.server.handle_request()

	def join(self,timeout=None):
		Thread.join(self, timeout)

	class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
		""" HTTP connection handler """

		handlers = {
			'404': Error404Plug,
			'': RedirectPlug,
			'control': ControlWebPlug,
			'xmlrpc': ControlXMLRPCPlug,
			'json': JSONRPCPlug,
			'content': SendContentPlug,
			'static': SendContentPlug,
			'dynamic': GenerateContentPlug,
			'stream': StreamPlug,
		}

		def do_GET(self):
			plug = self.path.split("/")[1]
			if (not getattr(self,"request_type", None)):
				self.request_type="GET"
			if self.handlers.has_key(plug):
				handler = self.handlers[plug](self)
				handler.process()
			else:
				self.handlers['404'](self).process()

		def do_POST(self):
			self.request_type="POST"
			self.do_GET()

		def do_HEAD(self):
			self.request_type="HEAD"
			self.do_GET()

