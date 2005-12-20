function callrpc(method, args, callback, url) {
	if (!XMLHttpRequest) {
		alert("Your browser is not supported")
		return
	}
	if (!url)
		url = "/xmlrpc/control";

	var xmlrpc = new XMLHttpRequest();

	xmlrpc.open("POST", url, true);
	xmlrpc.setRequestHeader("Content-type", "text/xml");

	var xml = "<methodCall>"
	xml += "<methodName>" + method + "</methodName>"
	xml += "<params><param>"
	xml += "<value>"
	xml += data2rpcparam(args);
	xml += "</value>"
	xml += "</param></params>"
	xml += "</methodCall>"

	xmlrpc.mycallback = callback

	// XXX: HACK!!!
	// This abuses the fact that local variables are still accessible and in-scope
	// inside anonymous, local functions.
	// This allows for multiple, simultaneous asynchronous xmlrpc calls to occur 
	// without individual calls stepping on others
	xmlrpc.onreadystatechange = function() {
		if (xmlrpc.readyState == 4) {
			var doc = xmlrpc.responseXML;
			var type = xmlrpc.getResponseHeader("Content-type");
			if (!type) {
				debug("Pimp server is down or an error occurred")
				return
			}


			debug("Type: " + type)
			if (type == "text/xml") {
				if (doc.childNodes[0].tagName != "methodResponse") {
					debug("UNEXPECTED NON-XMLRPC RESPONSE FROM SERVER");
					return;
				}
				var hash = rpcparam2hash(doc.childNodes[0]);
				xmlrpc.mycallback(hash)
			} else if (type == "application/xhtml+xml") {
				//Object.dpDump(xmlrpc)
				xmlrpc.mycallback(xmlrpc)
			} else if (type == "text/html") {
				xmlrpc.mycallback(xmlrpc)
			} else if (type = "text/plain") {
				xmlrpc.mycallback(xmlrpc.responseText)
			} else {
				debug("UNEXPECTED NON XML/HTML/PLAIN RESPONSE FROM SERVER");
			}

		}
	}

	xmlrpc.send(xml);
}

function mkelement(tag) {
	return document.createElementNS("http://www.w3.org/1999/xhtml",tag)
}

function mktext(val) {
	return document.createTextNode(val);
}

/*
 * Marshall a javascript dictionary into an XMLRPC document
 */

function data2rpcparam(h) {
	//var xml = "<!-- " + h + "-->";
	type = typeof h;
	var xml = "";

	xml += "<value>";
	//debug("Object: " + type + " / " + h.constructor);
	if (type == "object") {
		if (h.constructor == Array) {
			xml += "<array>";
			xml += "<data>";
			for (var i = 0; i < h.length; i++) {
				xml += data2rpcparam(h[i]);
			}
			xml += "</data>";
			xml += "</array>";
		} else {
			xml += "<struct>";
			for (key in h) {
				xml += "<member>";
				xml += "<name>" + key + "</name>";
				xml += data2rpcparam(h[key]);
				xml += "</member>";
			}
			xml += "</struct>";
		}
	} else {
		xml += "<value>";
		xml += "<string>" + h + "</string>";
		xml += "</value>";
	}
	xml += "</value>";

	//debug(xml)
	return xml
}

/*
 * Marshall an XMLRPC document into a JavaScript structure
 */
function rpcparam2hash(doc) {
	var rpc;
	if (doc.tagName == "methodResponse" || doc.tagName == "data") {
		//debug("[methodResponse|data]: " + doc.tagName)
		rpc = Array()
		for (var i = 0; i < doc.childNodes.length; i++) {
			if (doc.childNodes[i].nodeName != "#text") {
				var myparam
				//debug("Type(looping): " + doc.childNodes[i].nodeName)
				myparam = rpcparam2hash(doc.childNodes[i])
				rpc.push(myparam)
			}
		}
		//Object.dpDump(rpc)
	} else if (doc.tagName == "i4" || doc.tagName == "int"
		 || doc.tagName == "string" || doc.tagName == "boolean"
		 || doc.tagName == "double") {
		//debug("Convert ("+doc.tagName+"): " + doc.nodeValue)
		if (doc.childNodes.length > 0) {
			rpc = doc.childNodes[0].nodeValue;
		} else {
			rpc = "<empty data>"
		}
	} else if (doc.tagName == "struct") {
		rpc = Array()
		//debug("Struct length: " + doc.childNodes.length)
		for (var x = 0; x < doc.childNodes.length; x++) { // member node
			//debug("Run: " + x + " / " + doc.childNodes.length)
			var name;
			var value;
			var node = doc.childNodes[x]
			if (node.nodeName == "member") {
				//debug("Struct: " + node.nodeName)
				for (var y = 0; y < node.childNodes.length; y++) { // name or value
					var mynode = node.childNodes[y]
					if (mynode.tagName == "name") {
						name = mynode.childNodes[0].nodeValue
						//debug("--> Member(name): " + name)
					} else if (mynode.tagName == "value") {
						value = rpcparam2hash(mynode);
						//debug("--> Member(value): " + value)
					} else {
						//debug("Unknown (in struct): " + mynode.nodeName)
					}
				}
				//debug("Storing: " + name + " => " + value)
				rpc[name] = value
			}
		}
	} else if (doc.tagName == "value" || doc.tagName == "array") {
		// Arrays and values only one child and no data directly
		rpc = rpcparam2hash(doc.childNodes[0])
	} else {
		/* Nothing happens if we hit an element we don't know */
		debug("Unknown node: " + doc.nodeName)
	}

	return rpc
}

/* Useful recursive deletion of elements from a tree */

function delete_children(element, recursive) {
	if (!recursive)
		recursive=1
	var len = element.childNodes.length;
	for (var i = 0; i < len; i++) {
		if (recursive)
			delete_children(element.childNodes[0]);
		element.removeChild(element.childNodes[0]);
	}
}

