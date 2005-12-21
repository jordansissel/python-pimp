#!/usr/local/bin/python

import sys
import urllib 

sys.path.append("./modules")
sys.path.append("./extra")

# stuff I wrote
from template import Template

### XXX: Change this to your media directory if you want pimp to work
# XXX: Move this to some configuration-file thing.
MEDIAPATH = "/media/Audio"

# Two primary thread classes
from MusicDB import MusicDB
from ConnectionHandler import ConnectionHandler

class Pimp:#{{{
	def __init__(self):
		self.server = ConnectionHandler()
		self.musicdb = MusicDB()
		self.threads = [self.server, self.musicdb]

	def start(self):
		for a in self.threads:
			print "Starting %s thread" % a.getName()
			a.start()

		# Wait for threads to die
		for a in self.threads:
			a.join()
#}}}

class CGIParams:
	def __init__(self,request):
		self.request = request
		print "Request type: %s" % request.request_type
		parser = getattr(self, "parse%s" % request.request_type, None)
		if (not parser is None):
			self.params = parser()

	def parseGET(self):
		params = {}
		split = self.request.path.split("?", 2)
		if (len(split) > 1):
			query = urllib.unquote_plus(split[1])
			print "Query: %s" % query
			for i in query.split("&"):
				(key,val) = i.split("=",1)
				params[key] = val

		return params

	def parseHEAD(self):
		self.parseGET()

	def parsePOST(self):
		pass

# Unicode sucks, use ASCII
#def decode_string(val):
	#return val
#
#def adapt_string(val):
	#return unicode(val).encode("US-ASCII")
#
if __name__ == '__main__':
	#sqlite.register_adapter(str, adapt_string)
	#sqlite.register_converter('VARCHAR', decode_string)
	p = Pimp()
	p.start()
	p.join()
