var xmlrpc;
var interface_type = "workstation";

// For future touchscreen portability
if (interface_type == "workstation") {
	clickevent = "click";
} else {
	clickevent_type = "mousedown";
}

// Client-side storage of stream/client data
var pimp = {
	"streams": {},
};

function loadfunc() {
	var clicky = document.getElementById("test");
	clicky.addEventListener(clickevent, clickfunc, false);

	fixpositions();

	/* Load the streams list */
	call_updatestreams();
	start_timers()

	document.getElementById("streamlist_pane").style.display="block";
	debug("Loaded...")
}

function fixpositions() {
	var container = document.getElementById("container")
	var panes = container.childNodes;
	//debug("Top: " + findPosY(container));
	for (var i = 0; i < panes.length; i++) {
		if (panes[i].nodeName == "div") {
			//debug("panes[i].nodeName: " + panes[i].nodeName);
			if (panes[i].id != "streamlist_pane") {
				panes[i].style.display = "none";
			}
			panes[i].style.position= "absolute";
			panes[i].style.top = (findPosY(container) + 15) + "px";
		}
	}
}

function start_timers() {
	setTimeout(call_updatestreams, 2000)
}

function call_updatestreams() {
	call_xmlrpc("list_streams", {}, liststreams_callback)
	setTimeout(call_updatestreams, 2000)
}

function liststreams_callback(params) {
	var idx = 0
	var i;
	
	var updates = []

	for (i in params[0]) {
		updatestream(i, params[0][i], idx)
		updates.push("stream:" + i)
		idx++;
	}

	// Blow away old streams that aren't listed anymore
	var table = document.getElementById("streamlist_table");
	for (i = 0; i < table.childNodes.length; i++) {
		var el = table.childNodes[i];
		if (el.id) {
			var found = 0
			//debug(table.childNodes[i].tagName + ": " + table.childNodes[i].id)
			for (var x = 0; x < updates.length && !found; x++) {
				if (updates[x] == el.id) {
					found = 1;
				}
			}

			if (!found) {
				table.removeChild(el);
			}

		}
	}
}

function mkelement(tag) {
	return document.createElementNS("http://www.w3.org/1999/xhtml",tag)
}

function mktext(val) {
	return document.createTextNode(val);
}

function updatestream(name, streaminfo, idx) {
	// Update the hashtable
	pimp["streams"][name] = streaminfo;

	updatestreamlist(name, idx);
	updatestreampane(name, idx);
}

function updatestreamlist(name, idx) {
	var streaminfo = pimp["streams"][name];

	var list = document.getElementById("streamlist");
	var table = document.getElementById("streamlist_table")
	var streamentry = document.getElementById("stream:" + name);

	var currentsong  = streaminfo["song"]["filename"]
	var basename = "stream:" + name;
	if (streamentry) {
		songelement  = document.getElementById(basename + ":song");
		//debug("Testing: " + basename + ":song");
		//debug("Songelement: " + songelement.childNodes[0].childnodeValue);
		//debug("currentsong: " + currentsong);
		songelement.childNodes[0].nodeValue = currentsong;
	} else {
		streamrow = mkelement("tr")
		streamname = mkelement("td")
		streamsong = mkelement("td")
		streamclients = mkelement("td")

		streamname.style.width="10em";

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
		//streamname.id = basename + ":name";
		//streamsong.id = basename + ":song";
		//streamclients.id = basename + ":clients";
		namediv.id = basename + ":name";
		songdiv.id = basename + ":song";
		clientdiv.id = basename + ":clients";

		streamrow.addEventListener(clickevent, stream_drilldown, false);

		//debug("SN: " + streamname)
		streamrow.appendChild(streamname);
		streamrow.appendChild(streamsong);
		streamrow.appendChild(streamclients);

		// Append to table
		//debug("Foo: " + table)
		table.appendChild(streamrow)
		//debug("A: " + table);
		//debug("B: " + streamrow);
	}
}

function updatestreampane(name) {
	var streaminfo = pimp["streams"][name];

	// Update the streampane if necessary
	var streampane = document.getElementById("streamcontrol_pane");
	if (streampane && streampane.stream == name) {
		//debug("Updating streampane with " + name + " / " + streampane.stream);
		songel = document.getElementById("streampane:song");
		if (songel) {
			songel.childNodes[0].nodeValue = streaminfo["song"]["filename"];
		}
	}
}

function nextfunc() {
	debug("Calling 'next_song' on stream '"+ this.streamname +"'");
	call_xmlrpc("next_song", {"stream":this.streamname}, refreshcallback);
}

function refreshcallback(params) {
	//Object.dpDump(params)
	//cleardebug()
	debug("Next called on: " + params[0]["streamname"])
	streamname = params[0]["streamname"]
	//song = document.getElementById(streamname + "_song");
	song = document.getElementById(basename + ":song");
	song.childNodes[0].nodeValue = params[0]["songdata"]["filename"]

	//call_xmlrpc("list_streams", {}, liststreams_callback)
	var streampane = document.getElementById("streamcontrol_pane");
	debug("Foo: " + streampane)
	if (streampane.stream == params[0]["streamname"]) {
		debug("Updating streampane with " + name + " / " + streampane.stream);
		songel = document.getElementById("streampane:song");
		songel.childNodes[0].nodeValue = params[0]["songdata"]["filename"]
	}
}

function clickfunc() {
	//cleardebug()
	debug("Calling xmlrpc method 'search'")
	query = document.getElementById("query").value;
	debug("Query was '" + query + "'")
	call_xmlrpc("search", {any: query}, click_callback)
}

function xmlrpc_callback() {
	if (xmlrpc.readyState == 4) {
		var doc = xmlrpc.responseXML;
		if (!doc) {
			//debug("Pimp server is down")
			// Server is down?
			return
		}
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
	//foo.focus();
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

function stream_drilldown() {
	var listpane = document.getElementById("streamlist_pane");
	var streampane = document.getElementById("streamcontrol_pane");

	listpane.style.display = "none";
	streampane.style.display = "block";

	debug("Drilling into " + this.id.substr(7));
	populate_stream_pane(this.id.substr(7));

	//Object.dpDump(pimp["streams"])
}

function populate_stream_pane(streamname) {
	var streampane = document.getElementById("streamcontrol_pane");

	streampane.stream = streamname;
	if (streampane.childNodes.length > 0) {
		// Update the pane with our stream information
		var title = document.getElementById("streampane:title");
		var song = document.getElementById("streampane:song");
		title.childNodes[0].nodeValue = "Stream: " + streamname;
		song.childNodes[0].nodeValue = pimp["streams"][streamname]["song"]["filename"]
	} else {
		var section = mkelement("div");
		section.className="section";

		var title = mkelement("div");
		title.appendChild(mktext("Stream: " + streamname));
		title.id = "streampane:title";
		title.className = "stream-title";

		var song = mkelement("div");
		song.id = "streampane:song";
		song.appendChild(mktext(pimp["streams"][streamname]["song"]["filename"]))

		var nextbutton = mkelement("input");
		nextbutton.value="Next song";
		nextbutton.type="button";
		nextbutton.addEventListener(clickevent, function() {call_xmlrpc("next_song", {"stream":streamname}, refreshcallback);}, false);

		section.appendChild(title);
		section.appendChild(song);
		section.appendChild(nextbutton);
		streampane.appendChild(section);
	}
}

function show(what) {
	var i = 0;
	var container = document.getElementById("container");
	for (i = 0; i < container.childNodes.length; i++) {
		if (container.childNodes[i].nodeName == "div") {
			//debug("Show: " + container.childNodes[i].id + " == " + what);
			if (container.childNodes[i].id == what) {
				container.childNodes[i].style.display = "blocK";
			} else {
				container.childNodes[i].style.display = "none";
			}
		}
	}
}

// The next two functions from quirksmode.org
function findPosX(obj) {
	var curleft = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curleft += obj.offsetLeft
			obj = obj.offsetParent;
		}
	}
	else if (obj.x)
		curleft += obj.x;
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curtop += obj.offsetTop
			obj = obj.offsetParent;
		}
	}
	else if (obj.y)
		curtop += obj.y;
	return curtop;
}

window.onload = loadfunc;
