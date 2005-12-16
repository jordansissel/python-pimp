#!/usr/local/bin/python

import sys
from xml.dom import minidom
from xml import xpath

try:
	foo = minidom.parseString("testing")
	print foo
except:
	print "Failed to parse"

# Append a text node to 
#blah = xpath.Evaluate("/html", foo.documentElement)

#div = xpath.Evaluate("//*[@id='content']", foo.documentElement)
#div[0].appendChild(foo.createTextNode("Testing"))
#foo.writexml(sys.stdout)

