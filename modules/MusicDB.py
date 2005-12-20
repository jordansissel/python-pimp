
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
