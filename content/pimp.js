var xmlrpc;

function loadfunc() {
	var clicky = document.getElementById("test");
	if (clicky.addEventListener) {
		clicky.addEventListener("click", clickfunc, false);
	} else {
		clicky.onclick = clickfunc;
	}

	/* Load the streams list */
	call_xmlrpc("list_streams", {}, liststreams_callback)
	debug("Loaded...")
	//alert("Test")
	//var l=document.createElementNS("http://www.w3.org/1999/xhtml","div");
	//l.appendChild(document.createTextNode("testing"))
	//document.body.appendChild(l)

	start_timers()
}

function start_timers() {
	setTimeout(updatestreamlist, 1000)
}

function updatestreamlist() {
	call_xmlrpc("list_streams", {}, liststreams_callback)
	//setTimeout(updatestreamlist, 1000)
}

function liststreams_callback(params) {
	//debug("Stream list received")
	//Object.dpDump(params)
	var idx = 0
	for (i in params[0]) {
		updatestream(i, params[0][i], idx)
		idx++;
	}

	//Object.dpDump(params[0])
}

function mkelement(tag) {
	return document.createElementNS("http://www.w3.org/1999/xhtml",tag)
}

function mktext(val) {
	return document.createTextNode(val);
}

function updatestream(name, streaminfo, idx) {
	var list = document.getElementById("streamlist");
	var table = document.getElementById("streamlist_table")
	var streamentry = document.getElementById("stream:" + name);

	//var stringy = "[" + streaminfo["streaminfo"]["clients"] + " clients] Song: " + streaminfo["song"]["filename"]
	var currentsong  = streaminfo["song"]["filename"]
	var basename = "stream:" + name;
	if (streamentry) {
		songelement  = document.getElementById(basename + ":song")
		songelement.childNodes[0].nodeValue = currentsong
	} else {
		streamrow = mkelement("tr")
		streamname = mkelement("td")
		streamsong = mkelement("td")
		streamclients = mkelement("td")

		streamname.style.width="8em";

		streamrow.className = (idx % 2) ? "even" : "odd";

		tmpfunc = function(tag, val){
			var el = mkelement(tag);
			el.appendChild(mktext(val));
			el.style.height="1.15em";
			el.style.overflow="hidden";
			return el;
		}

		var namediv = tmpfunc("div", name.substr(8));
		var songdiv = tmpfunc("div", currentsong);
		var clientdiv = tmpfunc("div", streaminfo["streaminfo"]["clients"])

		streamname.appendChild(namediv);
		streamsong.appendChild(songdiv);
		streamclients.appendChild(clientdiv);

		streamrow.id = basename;
		streamname.id = basename + ":name";
		streamsong.id = basename + ":song";
		streamclients.id = basename + ":clients";

		//debug("SN: " + streamname)
		streamrow.appendChild(streamname);
		streamrow.appendChild(streamsong);
		streamrow.appendChild(streamclients);

		// Append to table
		table.appendChild(streamrow)
		streamsong.style.height="1em";
	}
}

function nextfunc() {
	debug("Calling 'next_song' on stream '"+ this.streamname +"'")
	call_xmlrpc("next_song", {"stream":this.streamname}, refreshcallback)
}

function refreshcallback(params) {
	//Object.dpDump(params)
	cleardebug()
	//debug("Next called on: " + params[0]["streamname"])
	streamname = params[0]["streamname"]
	song = document.getElementById(streamname + "_song");
	song.childNodes[0].nodeValue = params[0]["songdata"]["filename"]

	//call_xmlrpc("list_streams", {}, liststreams_callback)
}

function clickfunc() {
	cleardebug()
	debug("Calling xmlrpc method 'search'")
	query = document.getElementById("query").value;
	debug("Query was '" + query + "'")
	call_xmlrpc("search", {any: query}, click_callback)
}

function xmlrpc_callback() {
	if (xmlrpc.readyState == 4) {
		var doc = xmlrpc.responseXML;
		if (doc.childNodes[0].tagName != "methodResponse") {
			debug("UNEXPECTED NON-XMLRPC RESPONSE FROM SERVER");
			return;
		}

		//debug(xmlrpc.responseText)
		var hash = rpcparam2hash(doc.childNodes[0])

		xmlrpc.mycallback(hash)
	}
}

function click_callback(params) {
	for (var i in params[0]) {
		debug("params[0]["+i+"]['filename'] = "+params[0][i]['filename'])
	}
	//Object.dpDump(params)
}

function call_xmlrpc(method, args, callback) {
	if (XMLHttpRequest) {
		xmlrpc = new XMLHttpRequest();
	} else if (ActiveXObject) {
		xmlrpc = new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		alert("Your browser is not supported")
		return
	}
	//debug(xmlrpc)
	xmlrpc.open("POST", "/xmlrpc/control", true);
	xmlrpc.setRequestHeader("Content-type", "text/xml");

	var xml = "<methodCall>"
	xml += "<methodName>" + method + "</methodName>"
	xml += "<params><param>"
	xml += "<value>"
	xml += hash2rpcparam(args);
	xml += "</value>"
	xml += "</param></params>"
	xml += "</methodCall>"

	xmlrpc.onreadystatechange = xmlrpc_callback;
	xmlrpc.mycallback = callback
	xmlrpc.send(xml);
}

function cleardebug() {
	// Delete children
	//document.getElementById("debug").innerHTML = "";
	delete_children(document.getElementById("debug"))
}
function debug(val) {
	var list = document.getElementById("debug");
	var foo = mkelement("div");
	var text = mktext(val);
	foo.style.fontWeight="bold";
	foo.appendChild(text)
	list.appendChild(foo)
}

/*
 * Marshall a javascript dictionary into an XMLRPC document
 */

function hash2rpcparam(h) {
	var xml = "<!-- " + h + "-->";
	xml += "<struct>";
	for (key in h) {
		xml += "<member>";
		xml += "<name>" + key + "</name>";
		xml += "<value><string>" + h[key] + "</string></value>";
		xml += "</member>";
	}
	xml += "</struct>";

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
		//debug("Convert ("+doc.tagName+"): " + doc.childNodes[0].nodeValue)
		rpc = doc.childNodes[0].nodeValue;
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

function delete_children(element) {
	for (var i = 0; i < element.childNodes.length; i++) {
		element.removeChild(element.childNodes[i])
	}
}

window.onload = loadfunc
