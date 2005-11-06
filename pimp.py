#!/usr/local/bin/python

import SocketServer, BaseHTTPServer
from threading import Thread,Event
import xmlrpclib

import Queue

import socket
import os
import random

# Non-standard python modules
from pysqlite2 import dbapi2 as sqlite
import pyid3lib

### XXX: Change this to your media directory if you want pimp to work
# XXX: Move this to some configuration-file thing.
MEDIAPATH = "/media/Audio"

events = Queue.Queue()
streamlist = {}
clientlist = []

class RPC:
	ofunc = None
	def call(self, method, params, ofunc):
		self.ofunc = ofunc
		print "Calling RPC Method %s" % method
		func = getattr(self, "call_%s" % method, self.invalidcall)
		func(params)
	
	def respond(self, args):
		m = xmlrpclib.Marshaller("US-ASCII", 1)

		self.ofunc("<methodResponse>")

		file = open("/tmp/xmlrpc.debug", "a");
		if type(args) == type({}):
			m.dump_struct(args, self.ofunc)
			#m.dump_struct(args, file.write)
		elif type(args) == type([]):
			m.dump_array(args, self.ofunc)
			#m.dump_array(args, file.write)
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
		stream = streamlist[name]
		stream.nextsong()
		self.respond({ 
						 "songdata": stream.song,
						 "streamname": name,
						})

	def call_list_streams(self, params):
		results = {}
		for stream in streamlist:
			results[stream] = { 
				"song": streamlist[stream].song,
				"streaminfo": {
					"clients": len(streamlist[stream].clients)
				}
			}
		self.respond(results)

	def call_enqueue(self, params):
		print "Enqueue called"
		params = params[0]
		print params
		stream = streamlist[params["stream"]]
		stream.enqueue(params["list"]);
		self.respond("ok")
	
	def invalidcall(self, params):
		print "Invalid call"
		print "Params: ", params

class MusicDB(Thread):
	instance = None

	def __init__(self):
		self.needinit = 0
		self.dbpath = "%s/.pimpdb" % os.getenv("HOME")

		if not os.path.isfile(self.dbpath):
			print "Need to create db"
			self.needinit = 1

		# Initialize the db if we need to.
		if self.needinit:
			self.db = sqlite.connect(self.dbpath, detect_types=sqlite.PARSE_DECLTYPES)
			self.initdb()
			self.findmusic()
			self.db.close()

		self.queue = Queue.Queue()

		MusicDB.instance = self
		Thread.__init__(self,name="MusicDB")

	def request(self, method, args=None, result=None):
		event = Event()
		self.queue.put({"method":method, "args":args, "result":result, "event":event})

		# Wait until this item has been processed
		event.wait()
		if not result is None:
			return result

	def run(self):
		self.db = sqlite.connect(self.dbpath, detect_types=sqlite.PARSE_DECLTYPES)

		while 1:
			item = self.queue.get()
			print "Got Event: %s" % item["method"]
			func = getattr(self, "request_%s" % item["method"], self.invalid_request)
			func(item["args"], item["result"])
			item["event"].set()

	def invalid_request(self, args):
		print "INVALID MUSICDB REQUEST"

	def initdb(self):
		print "Creating database..."
		cur = self.db.cursor()
		cur.execute("""
			CREATE TABLE music (
				songid INTEGER PRIMARY KEY,
				artist VARCHAR,
				album VARCHAR,
				title VARCHAR,
				genre VARCHAR,
				filename VARCHAR
			)
		""")
		cur.close()

	def findmusic(self):
		print "Finding music in %s" % MEDIAPATH
		cur = self.db.cursor()
		os.path.walk(MEDIAPATH, self._findmusic, cur)
		cur.close()
		self.db.commit()

	def _findmusic(self, arg, dirname, fnames):
		cur = arg
		print "Dir: %s" % dirname
		songs = map(lambda x: "%s/%s" % (dirname, x), 
						filter(lambda x: x[-4:] == ".mp3", fnames))

		log = open("/tmp/id3log", "w")
		for s in songs:
			tag = pyid3lib.tag(s)
			binds = {
				"artist": getattr(tag, "artist", "Unknown"),
				"album": getattr(tag, "album", "Unknown"),
				"title": getattr(tag, "title", "Unknown"),
				"genre": getattr(tag, "genre", "Unknown"),
				"filename": s,
			}
			log.write("%s\n" % binds);
			log.flush()
			cur.execute("INSERT INTO music (artist, album, title, genre, filename) VALUES (:artist, :album, :title, :genre, :filename)", binds)

		log.close()

	def store_result(self, cursor, storage, fields=["songid", "artist", "album", "title", "genre", "filename"]):
				
		for res in cursor.fetchall():
			entry = {}
			idx = 0
			for col in fields:
				entry[col] = str(res[idx])
				idx += 1
			storage.append(entry)


	# XXX Rename this function to something more appropriate
	def request_get_random_song(self, args, results):
		cur = self.db.cursor()

		# XXX: Cache this.
		cur.execute("SELECT count(*) FROM music")
		rows = cur.fetchone()

		row = random.randint(0, rows[0] - 1)
		print "SELECT * FROM music LIMIT %d,1"%row
		cur.execute("SELECT * FROM music LIMIT %d,1" %row)
		song = []
		self.store_result(cursor=cur, storage=song)
		results["song"] = song[0]
		return song[0]

	def request_search_id_field(self, args, results):
		fields = ["songid"]
		return self.__request_search(args,fields,results,0)
	
	def request_search_all_fields(self, args, results):
		fields = ["artist", "album", "title", "filename"]
		return self.__request_search(args,fields, results)

	def __request_search(self, args, fields, results, uselike=1):
		print "SEARCHING"
		cur = self.db.cursor()
		#fields = ["artist", "album", "title", "filename"]
		query = "SELECT songid,artist,album,title,genre,filename FROM music WHERE "

		if uselike:
			expression = "(%s)" % " OR ".join(map(lambda x: "%s LIKE ?" % x, fields))
		else:
			expression = "(%s)" % " OR ".join(map(lambda x: "%s = ?" % x, fields))
		query += " AND ".join(map(lambda x: expression, args))
		query += " LIMIT 300"
		print "QUERY: %s" % query

		# Can you read this? ;)
		binds = []
		if uselike:
			map(lambda x: binds.extend(map(lambda y: "%%%s%%" % x, fields)), args)
		else:
			map(lambda x: binds.extend(map(lambda y: x, fields)), args)

		print "SQLARGS: %s" % binds
		cur.execute(query, binds)
		
		for i in cur.fetchall():
			entry = {
				"songid": str(i[0]),
				"artist": str(i[1]),
				"album": str(i[2]),
				"title": str(i[3]),
				"genre": str(i[4]), 
				"filename": str(i[5]),
			}
			print "Found: %s" % entry
			results.append(entry)

		return results

class MP3Client:
	def __init__(self, plug):
		#self.music = MusicList()
		self.plug = plug
		self.request = plug.request
		self.output = self.request.wfile
		(self.myhost, self.myport) = self.request.request.getsockname()
		(self.yourhost, self.yourport) = self.request.request.getpeername()
		try:
			self.myhost = socket.gethostbyaddr(self.myhost)[0]
		except:
			print "Failed host lookup for %s" % self.myhost

		try:
			self.yourhost = socket.gethostbyaddr(self.yourhost)[0]
		except:
			print "Failed host lookup for %s" % self.yourhost

		if streamlist.has_key(self.request.path):
			self.stream = streamlist[self.request.path]
		else:
			self.stream = MP3Stream(self.request.path)
			streamlist[self.request.path] = self.stream

		self.stream.register_client(self)

	def __str__(self):
		return "%s:%d" % (self.yourhost, self.yourport)

	def respond(self):
		response = []
		response.append("ICY 200 OK") # Standard shoutcast response
		response.append("icy-url: http://%s:%d/%s" 
							 % (self.myhost, self.myport, self.request.path[1:]))
		response.append("icy-name: Pimp 4.0")

		# Send the response header
		self.output.write("%s\n\n" % "\n".join(response))
	
	def broadcast(self):
		clientlist.append(self)
		print "New client: %s" % self
		print map(lambda x: "%s" % x, clientlist)
		self.respond()

		try:
			while 1:
				song = self.stream.currentsong()
				print "My song: %s" % (song)
				self.plug.sendfile(song["filename"])
				self.stream.nextsong()
		except socket.error:
			print "SERVER: Client %s:%d disconnected or died" \
				% (self.yourhost,self.yourport)
			if clientlist.index(self) > -1:
				self.stream.kill_client(self)
				clientlist.remove(self)
			else:
				print "Disconnected client not found in client list (UNEXPECTED ERROR)"

class MP3Stream:
	def __init__(self, request, name="Unknown Stream"):
		#self.music = MusicList()
		self.clients = []
		self.queue = []
		self.name = name
		self.song = None

	def register_client(self, client):
		self.clients.append(client)

	def kill_client(self, client):
		self.clients.remove(client)

	def currentsong(self):
		if self.song is None:
			self.nextsong()

		return self.song

	def nextsong(self):
		song = {}
		if len(self.queue) > 0:
			self.song = self.queue.pop()
		else:
			MusicDB.instance.request(method="get_random_song", result=song)
			self.song = song["song"]

		print "DEBUG:::: %s" % self.song

	def enqueue(self, list):
		for s in list:
			song = [] 
			MusicDB.instance.request(method="search_id_field", args=[s], result=song)
			print "DATA"
			print song
			self.queue.extend(song)

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

class Plug:#{{{
	def __init__(self,request):
		self.request = request
	
	def sendfile(self, src):
		if not os.path.isfile(src):
			print "No such file: %s" % src
			return 0

		f = open(src)
		data = f.read(4096)
		while data:
			self.request.wfile.write(data)
			data = f.read(4096)
#}}}
class RedirectPlug(Plug):#{{{
	def process(self):
		r = self.request
		r.send_response(302)
		r.send_header("Location","/control")
		r.end_headers()
#}}}
class ControlWebPlug(Plug):#{{{
	def process(self):
		r = self.request
		r.send_response(200)
		r.send_header("Content-type", SendContentPlug.content_type["html"])
		r.end_headers()

		if r.command == "GET":
			self.sendfile("content/index.html")
#}}}
class ControlXMLRPCPlug(Plug):#{{{
	def process(self):
		r = self.request
		data = r.rfile.read(int(r.headers["content-length"]))
		(params, method) = xmlrpclib.loads(data)

		r.send_response(200)
		r.send_header("Content-type", "text/xml")
		r.end_headers()

		rpc = RPC()
		rpc.call(method, params, r.wfile.write)


#}}}
class GenerateContentPlug(Plug):#{{{
	def process(self):
		r = self.request

#}}}
class StreamPlug(Plug):#{{{
	def process(self):
		client = MP3Client(self)
		if r.command == "GET"
			client.broadcast()

#}}}
class Error404Plug(Plug):#{{{
	def process(self):
		r = self.request
		r.send_response(404)
		r.send_header("Content-type", "text/html")
		r.end_headers()
		
		if r.command == "GET":
			self.sendfile("content/404.html")
#}}}
class SendContentPlug(Plug):#{{{
	content_type = {
		"css": "text/css",
		#"html": "text/html",
		"html": "application/xhtml+xml",
		"js": "text/javascript",
		"jpg": "image/jpeg",
		"png": "image/png",
	}

	def process(self):
		r = self.request
		path = "/".join(r.path.split("/")[1:])
		print "PATH: %s" % path

		if path.find("..") > -1:
			Error404Plug(r).process()
			return
		if not os.path.isfile(path):
			Error404Plug(r).process()
			return

		ext = path.split(".")[-1]
		ctype = self.content_type.has_key(ext) \
			and self.content_type[ext] or "text/plain"
		r.send_response(200)
		r.send_header("Content-type", ctype)
		r.end_headers()

		if r.command == "GET":
			self.sendfile(path)
#}}}

class ConnectionHandler(Thread):#{{{
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
			'content': SendContentPlug,
			'generate': GenerateContentPlug,
			'stream': StreamPlug,
		}


		def do_GET(self):
			plug = self.path.split("/")[1]
			if self.handlers.has_key(plug):
				handler = self.handlers[plug](self)
				handler.process()
			else:
				self.handlers['404'](self).process()

		def do_POST(self):
			self.do_GET()

		def do_HEAD(self):
			self.do_GET()
#}}}

# Unicode sucks, use ASCII
def decode_string(val):
	return val

def adapt_string(val):
	#for v in val:
		#if (ord(v) > 127):
			#v = "&#x%02d;" % hex(ord(v));
		#string += v
	return unicode(val).encode("US-ASCII")

if __name__ == '__main__':
	sqlite.register_adapter(str, adapt_string)
	sqlite.register_converter('VARCHAR', decode_string)
	p = Pimp()
	p.start()
	p.join()

	#results = []
	#print "Requesting search_all_fields"
	#MusicDB.instance.request(method="search_all_fields", args=["nightwish"], result=results)
#
	#print "RESULTS:"
	#for i in results:
		#print i["filename"]
