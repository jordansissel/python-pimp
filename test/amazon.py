#!/usr/local/bin/python

import urllib
from xml.dom import minidom
import sgmllib
from xml import xpath
import re

def getalbumcover(args):
	amazonurl = "http://webservices.amazon.com/onca/xml"
	params = {
		'Service': "AWSECommerceService",
		'AWSAccessKeyId': "03TSBYPH33N0PXE5RSR2",
		'SearchIndex': "Music",
		'Operation': "ItemSearch",
		'Artist': args["artist"],
		'Title': args["album"],
	}
	
	args = urllib.urlencode(params)
	url = "%s?%s" % (amazonurl, args)

	u1 = urllib.urlopen(url);
	dom = minidom.parseString(u1.read());

	albumpage = xpath.Evaluate("//Item/DetailPageURL", dom)[0].childNodes[0].nodeValue;
	u2 = urllib.urlopen(albumpage);
	m = re.compile("amz_js_PopWin\('(http://[^']+)");
	imgurl = filter(lambda x: not re.search("/images/", x) is None, m.findall(u2.read()))[0]
	u3 = urllib.urlopen(imgurl);
	matches = re.search('<img src="([^"]+)"',u3.read())
	if not matches is None:
		print matches.group(1)

if __name__ == "__main__":
	_lookup({'artist': "sublime", 'album': "sublime"})

