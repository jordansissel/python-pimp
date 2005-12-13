#!/usr/local/bin/python

from xml.dom import minidom
from xml import xpath

class Template:
	def __init__(self, filename):
		self.dom = minidom.parse(filename);

	def setTextById(self, id, text):
		element = xpath.Evaluate("/html/body//*[@id='content']", self.dom.documentElement)[0]
		for el in filter(lambda x: x.nodeType == 3, element.childNodes):
			element.removeChild(el)
		element.appendChild(self.dom.createTextNode(text))


	def output(self, writer):
		self.dom.writexml(writer);

if __name__ == "__main__":
	import sys
	t = Template("test/layout.html")
	t.test()
	#t.setTextById("content", "one two three")
	#t.output(sys.stdout)
