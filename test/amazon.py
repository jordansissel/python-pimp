#!/usr/local/bin/python

import urllib
from xml.dom import minidom
import sgmllib
from xml import xpath
import re

amazonurl = "http://webservices.amazon.com/onca/xml"

params = {
	'Service': "AWSECommerceService",
	'AWSAccessKeyId': "03TSBYPH33N0PXE5RSR2",
	'SearchIndex': "Music",
	'Operation': "ItemSearch",
	'Artist': "Blind Guardian",
	'Title': "A Night At The Opera",
}

args = urllib.urlencode(params)
url = "%s?%s" % (amazonurl, args)

u = urllib.urlopen(url);
dom = minidom.parseString(u.read());

albumpage = xpath.Evaluate("//Item/DetailPageURL", dom)[0].childNodes[0].nodeValue;

print "Fetching: %s" % albumpage
y = urllib.urlopen(albumpage);

lines = y.read().split("\n");

ready = 0;
m = re.compile("^.*img src=\"([^\"]+)\".*$");
for i in lines:
	if (ready):
		m.match(i)
		print "OK: %s" % m.group(0)

	if (i == "<table border=0 align=left><tr><td valign=top align=center>"):
		ready = 1



