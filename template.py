#!/usr/local/bin/python

from xml.dom import minidom
from xml import xpath

class Template:
	def __init__(self, filename):
		self.dom = minidom.parse(filename);

	def getElementById(self, id, doc=None):
		if (doc is None):
			doc = self.dom.documentElement
		return xpath.Evaluate("/html/body//*[@id='%s']" % id, doc)[0]

	def setTextById(self, id, text):
		element = self.getElementById(id)
		for el in filter(lambda x: x.nodeType == 3, element.childNodes):
			element.removeChild(el)
		element.appendChild(self.dom.createTextNode(text))

	def replicate(self, id, data):
		original = self.getElementById(id)
		parent = original.parentNode
		data.reverse()
		print "Data: %s" % data
		for d in data:
			parent.appendChild(self.replicateElement(original, d))

		# Remove the template
		#print "Removing %s from %s" % (original.nodeName, parent.nodeName)
		parent.removeChild(original)

	def replicateElement(self, element, data):
		newelement = element.cloneNode(1)
		x = 0

		for k in data.keys():
			el = self.getElementById(k, newelement)
			el.setAttribute("id", "dup.%d" % x)
			el.appendChild(self.dom.createTextNode(data[k]))
			x = x + 1

		return newelement

	def output(self, writer):
		self.dom.writexml(writer);

if __name__ == "__main__":
	import sys
	t = Template("test/layout.html")
	t.replicate("row", [ {"one": "onetest", "two": "twotest"}, {"one": "threetest", "two": "fourtest" }])
	t.output(sys.stdout)
