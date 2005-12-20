
class MP3Stream: 
	def __init__(self, request, name="Unknown Stream"):
		#self.music = MusicList()
		self.clients = []
		self.queue = []
		self.name = name
		self.song = None
		self.songplayid = 0

	def register_client(self, client):
		self.clients.append(client)

	def kill_client(self, client):
		self.clients.remove(client)

	def currentsong(self):
		if self.song is None:
			self.nextsong()
		return self.song

	# Only go to the "next song" if we haven't picked one yet
	def smart_nextsong(self,oldsong):
		if self.songplayid == oldsong["playid"]:
			self.nextsong()

	def nextsong(self):
		song = {}
		if len(self.queue) > 0:
			self.song = self.queue.pop()
		else:
			MusicDB.instance.request(method="get_random_song", result=song)
			self.song = song["song"]

		self.songplayid += 1
		self.song["playid"] = self.songplayid

		print "DEBUG:: %s" % self.song

	def enqueue(self, list):
		for s in list:
			song = [] 
			MusicDB.instance.request(method="search_id_field", args=[s], result=song)
			print "DATA"
			print song
			self.queue.extend(song)

