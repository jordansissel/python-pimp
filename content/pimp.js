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
}

function liststreams_callback(params) {
	debug("Stream list received")
	//Object.dpDump(params)
	for (i in params[0]) {
		addstream(i, params[0][i])
	}

	//Object.dpDump(params[0])
}

function addstream(name, streaminfo) {
	var list = document.getElementById("streamlist");
	var foo = document.createElement("div")
	var text = document.createTextNode("Stream: " + name);
	var next = document.createElement("input")
	var playing = document.createElement("div")
	next.type = "button";
	next.value = "Next Song";
	next.streamname = name
	next.addEventListener("click", nextfunc, false);

	playing.appendChild(document.createTextNode("Song: " + streaminfo["filename"]))

	foo.style.fontWeight="bold";
	foo.appendChild(text)
	foo.appendChild(next)
	foo.appendChild(playing)
	list.appendChild(foo)
}

function nextfunc() {
	debug("Calling 'next_song' on stream '"+ this.streamname +"'")
	call_xmlrpc("next_song", {"stream":this.streamname}, refreshcallback)
}

function refreshcallback(params) {
	//Object.dpDump(params)
	document.getElementById("streamlist").innerHTML = "";
	call_xmlrpc("list_streams", {}, liststreams_callback)
}

function clickfunc() {
	document.getElementById("streamlist").innerHTML = "";
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

function debug(val) {
	var list = document.getElementById("streamlist");
	var foo = document.createElement("div")
	var text = document.createTextNode(val);
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

window.onload = loadfunc
