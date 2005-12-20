
from MusicDB import MusicDB
import xmlrpclib

class RPC:
	ofunc = None
	def __init__(self):
		self.streamlist = MusicDB.instance.streamlist

	def call(self, method, params, ofunc):
		self.ofunc = ofunc
		print "Calling RPC Method %s" % method
		func = getattr(self, "call_%s" % method, self.invalidcall)
		func(params)
	
	def respond(self, args):
		m = xmlrpclib.Marshaller("US-ASCII", 1)

		self.ofunc("<methodResponse>")

		if type(args) == type({}):
			m.dump_struct(args, self.ofunc)
		elif type(args) == type([]):
			m.dump_array(args, self.ofunc)
		self.ofunc("</methodResponse>")
		

	def call_control(self, params):
		print "CONTROL"
		hash = {
			"result": str(int(params[0]["p1"]) + int(params[0]["p2"]))
		}
		self.respond(hash)

	def call_search(self, params):
		results = []
		print "PARAMS::::::"
		print params
		query = params[0]["any"].split(" ");
		MusicDB.instance.request(method="search_all_fields", args=query, result=results)
		print "Found %d songs!!!" % len(results)
		self.respond(results)

	def call_next_song(self, params):
		name = params[0]["stream"]
		stream = self.streamlist[name]
		stream.nextsong()
		self.respond({ 
						 "songdata": stream.song,
						 "streamname": name,
						})

	def call_list_streams(self, params):
		results = {}
		for stream in self.streamlist:
			results[stream] = { 
				"song": self.streamlist[stream].song,
				"streaminfo": {
					"clients": len(self.streamlist[stream].clients)
				}
			}
		self.respond(results)

	def call_enqueue(self, params):
		print "Enqueue called"
		params = params[0]
		print params
		stream = self.streamlist[params["stream"]]
		stream.enqueue(params["list"]);
		self.respond("ok")
	
	def invalidcall(self, params):
		print "Invalid call"
		print "Params: ", params

