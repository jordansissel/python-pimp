
from MusicDB import MusicDB
import xmlrpclib
import json

class RPC:
	ofunc = None
	def __init__(self):
		self.streamlist = MusicDB.instance.streamlist
		self.respond = self.json_respond

	def call(self, method, params, ofunc):
		self.ofunc = ofunc
		print "Calling RPC Method %s" % method
		func = getattr(self, "call_%s" % method, self.invalidcall)
		func(params)
	
	def xmlrpc_respond(self, args):
		m = xmlrpclib.Marshaller("US-ASCII", 1)

		self.ofunc("<methodResponse>")

		if type(args) == type({}):
			m.dump_struct(args, self.ofunc)
		elif type(args) == type([]):
			m.dump_array(args, self.ofunc)
		self.ofunc("</methodResponse>")

	def json_respond(self, args):
		self.ofunc(json.write(args))

	def call_search(self, params):
		results = []
		#print "PARAMS::::::"
		#print params
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

	def call_loadstream(self, params):
		print "Loadstream called"
		params = params[0]
		print params
		stream = self.streamlist[params["stream"]]
		
		streaminfo = {
			'song': stream.song,
			'name': stream.name,
			'clients': len(stream.clients),
			'queue': stream.queue,
		}

		self.respond(streaminfo)

	def invalidcall(self, params):
		print "Invalid call"
		print "Params: ", params
		self.respond("INVALID CALL")

