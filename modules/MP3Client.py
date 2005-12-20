
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
		response.append("icy-name: Pimp 4.0 (%s)" % (self.request.path[1:]))

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
				self.stream.smart_nextsong(song)
		except socket.error:
			print "SERVER: Client %s:%d disconnected or died" \
				% (self.yourhost,self.yourport)
			if clientlist.index(self) > -1:
				self.stream.kill_client(self)
				clientlist.remove(self)
			else:
				print "Disconnected client not found in client list (UNEXPECTED ERROR)"

