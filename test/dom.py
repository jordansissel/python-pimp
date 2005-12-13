#!/usr/local/bin/python

import sys
from xml.dom import minidom
from xml import xpath

if __name__ == '__main__':
	foo = minidom.parse("layout.html")

	# Append a text node to 
	div = xpath.Evaluate("//*[@id='content']", foo.documentElement)
	div[0].appendChild(foo.createTextNode("Testing"))
	foo.writexml(sys.stdout)

