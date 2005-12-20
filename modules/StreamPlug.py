
from MP3Client import MP3Client

from Plug import Plug
class StreamPlug(Plug):
	def process(self):
		client = MP3Client(self)
		if self.request.command == "GET":
			client.broadcast()


