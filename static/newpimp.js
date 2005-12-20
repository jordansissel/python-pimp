var interface_type = "workstation";

// For future touchscreen portability
if (interface_type == "workstation") {
	clickevent = "click";
} else {
	clickevent = "mousedown";
}

// Client-side storage of stream/client data
var pimp = {
	"streams": {},
	"search": {}
};

function loadfunc() {
	var clicky = document.getElementById("test");
	clicky.addEventListener(clickevent, searchclickfunc, false);

	//fixpositions();

	/* Load the streams list */
	call_xmlrpc("list_streams", {}, liststreams_callback)
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
	setTimeout(call_updatestreams, 30000)
}

function call_updatestreams() {
	call_xmlrpc("list_streams", {}, liststreams_callback)
	setTimeout(call_updatestreams, 30000)
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

	var currentsong  = prettysong(streaminfo["song"])
	var basename = "stream:" + name;
	if (streamentry) {
		var songelement  = document.getElementById(basename + ":song");
		var clientselement  = document.getElementById(basename + ":clients");

		//debug("Testing: " + basename + ":song");
		//debug("Songelement: " + songelement.childNodes[0].childnodeValue);
		//debug("currentsong: " + currentsong);
		songelement.childNodes[0].nodeValue = currentsong;
		clientselement.childNodes[0].nodeValue = streaminfo["streaminfo"]["clients"];
	} else {
		var streamrow = mkelement("tr")
		var streamname = mkelement("td")
		var streamsong = mkelement("td")
		var streamclients = mkelement("td")

		streamname.style.width="8em";

		streamrow.className = (idx % 2) ? "even" : "odd";

		var tmpfunc = function(tag, val){
			var el = mkelement(tag);
			el.appendChild(mktext(val));
			//el.style.height="1.15em";
			//el.style.overflow="hidden";
			return el;
		}

		var namediv = tmpfunc("div", name.substr(8));
		var songdiv = tmpfunc("div", currentsong);
		var clientdiv = tmpfunc("div", streaminfo["streaminfo"]["clients"])

		streamname.appendChild(namediv);
		streamsong.appendChild(songdiv);
		streamclients.appendChild(clientdiv);

		streamrow.id = basename;
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
			songel.childNodes[0].nodeValue = prettysong(streaminfo["song"]);
		}
	}
}

function nextfunc() {
	debug("Calling 'next_song' on stream '"+ this.streamname +"'");
	call_xmlrpc("next_song", {"stream":this.streamname}, nextsong_callback);
}

function nextsong_callback(params) {
	Object.dpDump(params);
}

function refreshcallback(params) {
	//Object.dpDump(params)
	//cleardebug()
	debug("Next called on: " + params[0]["streamname"])
	var streamname = params[0]["streamname"]
	var basename = "stream:" + streamname;
	//song = document.getElementById(streamname + "_song");
	song = document.getElementById(basename + ":song");
	song.childNodes[0].nodeValue = prettysong(params[0]["songdata"]);

	//call_xmlrpc("list_streams", {}, liststreams_callback)
	var streampane = document.getElementById("streamcontrol_pane");
	//debug("Foo: " + streampane)
	if (streampane.stream == params[0]["streamname"]) {
		debug("Updating streampane with " + name + " / " + streampane.stream);
		songel = document.getElementById("streampane:song");
		songel.childNodes[0].nodeValue = prettysong(params[0]["songdata"]);
	}
}

function searchclickfunc() {
	//cleardebug()
	debug("Calling xmlrpc method 'search'")
	query = document.getElementById("query").value;
	debug("Query was '" + query + "'")
	call_xmlrpc("search", {any: query}, searchclick_callback)
}


function searchclick_callback(params) {
	showsearchresults(params[0]);
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
	list.style.display="none";
}

function stream_drilldown() {
	var listpane = document.getElementById("streamlist_pane");
	var streampane = document.getElementById("streamcontrol_pane");

	// Show the searchbar now that we've selected a stream
	document.getElementById("searchbar").style.display="block";

	listpane.style.display = "none";
	streampane.style.display = "block";

	pimp["currentstream"] = this.id.substr(7);
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
		song.childNodes[0].nodeValue = prettysong(pimp["streams"][streamname]["song"])

		var button = document.getElementById("next-song")
		//button.addEventListener(clickevent, function() {call_xmlrpc("next_song", {"stream":streamname}, refreshcallback);}, false);
		button.onclick = function() {call_xmlrpc("next_song", {"stream":streamname}, refreshcallback);};
	debug("Drilling into " + this.id.substr(7));
	} else {
		var section = mkelement("div");
		section.className="section";

		var title = mkelement("div");
		title.appendChild(mktext("Stream: " + streamname));
		title.id = "streampane:title";
		title.className = "stream-title";

		var song = mkelement("div");
		song.id = "streampane:song";
		song.appendChild(mktext(prettysong(pimp["streams"][streamname]["song"])))

		var nextbutton = mkelement("input");
		nextbutton.id="next-song";
		nextbutton.value="Next song";
		nextbutton.type="button";
		//nextbutton.addEventListener(clickevent, function() {call_xmlrpc("next_song", {"stream":streamname}, refreshcallback);}, false);
		nextbutton.onclick = function() {call_xmlrpc("next_song", {"stream":streamname}, refreshcallback);};

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
				container.childNodes[i].style.display = "block";
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

function showsearchresults(param) {
	var searchpane = document.getElementById("search_pane");
	debug("SHOWSEARCHRESULTS CALLED");
	delete_children(searchpane);

	var clicktoadd = mkelement("div");
	clicktoadd.className="search_clicktoenqueue";
	clicktoadd.appendChild(mktext("ADD SELECTED SONGS TO QUEUE"));
	clicktoadd.addEventListener(clickevent, enqueue_items, false);

	var tdiv = mkelement("div");
	var tbl = mkelement("table");

	tbl.width="90%";
	tbl.align="center"

	// Headers
	var header = mkelement("tr");
	var rhdr = mkelement("th");
	rhdr.width="50%";
	rhdr.appendChild(mktext("Search results"));
	var ehdr = mkelement("th");
	ehdr.width="50%";
	ehdr.appendChild(mktext("Songs to enqueue"));

	header.appendChild(rhdr);
	header.appendChild(ehdr);

	tbl.appendChild(header);

	// Table body
	var tr = mkelement("tr");

	var restd = mkelement("td");
	var enqtd = mkelement("td");

	var resultsdiv = mkelement("div");
	resultsdiv.className = "searchresults_resultspane";
	resultsdiv.id = "resultsdiv";

	var enqueuediv = mkelement("div");
	enqueuediv.className = "searchresults_enqueuepane";
	enqueuediv.id = "enqueuediv";

	for (var i = 0; i < param.length; i++) {
		var result = mkelement("div");
		result.className = "searchresult";
		result.appendChild(mktext(prettysong(param[i])));
		result.songid = param[i]["songid"];
		result.style.backgroundColor = (i % 2)  ? "#D8D8DF" : "#E8E8EF";
		result.addEventListener(clickevent, enqueue_song, false);
		resultsdiv.appendChild(result);
	}

	restd.width="50%";
	restd.valign="top";
	enqtd.width="50%";
	enqtd.valign="top";


	restd.appendChild(resultsdiv);
	enqtd.appendChild(enqueuediv);

	tr.appendChild(restd);
	tr.appendChild(enqtd);

	tbl.appendChild(tr);
	tdiv.appendChild(tbl);

	debug("Pane children: " + searchpane.childNodes.length);

	searchpane.appendChild(clicktoadd);
	searchpane.appendChild(tdiv);

	show("search_pane");
}

function prettysong(song) {
	var format = "[%ARTIST%] %ALBUM% - %TITLE%";

	format = format.replace("%ARTIST%", song["artist"]);
	format = format.replace("%ALBUM%", song["album"]);
	format = format.replace("%TITLE%", song["title"]);

	var errcount = 0;
	if (song["artist"] == "Unknown") { errcount++; }
	if (song["title"] == "Unknown") { errcount++; }
	if (song["album"] == "Unknown") { errcount++; }

	if (errcount > 1) {
		format = song["filename"];
	}

	return format;
}

function enqueue_song() {
	var enqueuediv = document.getElementById("enqueuediv");
	enqueuediv.appendChild(this);
}

function enqueue_items() {
	debug("Enqueue items...");
	var enqueuediv = document.getElementById("enqueuediv");
	var list = [];

	for (var i = 0; i < enqueuediv.childNodes.length; i++) {
		debug("appending " + enqueuediv.childNodes[i].songid)
		list.push(enqueuediv.childNodes[i].songid)
	}

	call_xmlrpc("enqueue", {stream: pimp["currentstream"], list: list}, enqueue_callback);
}

function enqueue_callback() {
	debug("Enqueue callback success?");
}

window.onload = loadfunc;
