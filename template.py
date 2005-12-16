#!/usr/local/bin/python

from xml.dom import minidom
from xml import xpath

class Template:
	def __init__(self, filename):
		self.dom = minidom.parse(filename);

	def getElementById(self, id, doc=None):
		if (doc is None):
			doc = self.dom.documentElement
		query = ".//*[@id='%s']" % id
		e = xpath.Evaluate(query, doc)
		return (len(e) > 0) and e[0] or None

	def setTextById(self, id, text):
		element = self.getElementById(id)
		for el in filter(lambda x: x.nodeType == 3, element.childNodes):
			element.removeChild(el)
		element.appendChild(self.dom.createTextNode(text))

	def replicate(self, id, data):
		original = self.getElementById(id)
		parent = original.parentNode
		x = 0
		for d in data:
			newel = self.replicateElement(original, d, x)
			newel.setAttribute("id", "%s.%d" % (id,x))
			parent.appendChild(newel)
			x += 1

		parent.removeChild(original)

	def replicateElement(self, element, data, index):
		newelement = element.cloneNode(1)
		for k in data.keys():
			(type,key) = k.split(":",2)
			repmethod = getattr(self, "rep_%s" % type, None)
			if not repmethod is None:
				repmethod(key, data[k], newelement)

		return newelement

	def rep_baseattr(self, key, val, base):
		base.setAttribute(key, val)
	
	def rep_id(self, key, val, base):
		el = self.getElementById(key, base)
		if (not el is None):
			el.setAttribute("id", "%s.%d" % (key,1))
			el.appendChild(self.dom.createTextNode("%s" % val))
		else:
			print "NO ELEMENT FOUND"

	def output(self, writer):
		self.dom.writexml(writer);

if __name__ == "__main__":
	import sys
	t = Template("templates/layout.html")
	data = [
		{ "baseattr:onclick": "javascript:" },
		{ "id:_streamname": "whack",
		  "id:_currentsong": "[Bjork] Something Nutty - I attack reporters" 
		},
		{ "id:_streamname": "work", "id:_currentsong": "[Green Day] Dookie - Razzle!" },

	]
	t.replicate("_streamentry", data)
	t.output(sys.stdout)
