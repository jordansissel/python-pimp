var interface_type = "workstation";

// For future touchscreen portability
if (interface_type == "workstation") {
	clickevent = "click";
} else {
	clickevent = "mousedown";
}

Pimp = {}
Pimp.initdone = 0;

Pimp.init = function() {/*{{{*/
	Pimp.streams = {};

	Pimp.liststreams();
	Pimp.interval(Pimp.liststreams, 3000)

	setTimeout(function() { Pimp.initdone = 1 }, 3000);
}/*}}}*/

/*
 * Helper Functions
 */
Pimp.interval = function(func, timeout) {
	//debug("Calling func in " + timeout + "ms");
	setTimeout( function() { func(); Pimp.interval(func, timeout) }, timeout);
}

Pimp.prettysong = function(song) {/*{{{*/
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
}/*}}}*/

/*
 * RPC Functions
 */
Pimp.liststreams = function() {/*{{{*/
	callrpc("list_streams", {}, Pimp.callback_liststreams);
}/*}}}*/

Pimp.loadstream = function(name) {/*{{{*/
	callrpc("loadstream", {"stream":name}, Pimp.callback_loadstream);
}/*}}}*/

/*
 * RPC Callbacks
 */

Pimp.callback_liststreams = function(params) {/*{{{*/
	Pimp.updateStreamList(params);
	//Object.dpDump(params);
}/*}}}*/

Pimp.callback_loadstream = function(params) {/*{{{*/
	/* Load the stream pane in the background? */
	var streamdoc = Pimp.getStreamPane(params);
	streamdoc.style.display="block";
	setTimeout(function() { 
				  Effect.Appear(streamdoc, 1000);
				  }, 1);
}

Pimp.showStreamPane = function(params) {/*{{{*/
	var streamdoc = Pimp.getStreamPane({'stream': Pimp.mystream});
}/*}}}*/

Pimp.getStreamPane = function(params) {/*{{{*/
	var streamdoc = document.getElementById("streaminfo_pane");
	
	if (streamdoc)
		return streamdoc;

	streamdoc = mkelement("div");
	streamdoc.id = "streaminfo_pane";

	var titlebar = mkelement("div");
	var titlename = mkelement("div");
	titlename.appendChild(mktext(params["name"] + " (/stream/blah)"));
	var clientnum = mkelement("span");
	clientnum.appendChild(mktext("[" + params["clients"] + " clients]"));
	clientnum.style.fontSize = "small";
	clientnum.style.float = "right";

	titlebar.appendChild(titlename);
	titlebar.appendChild(clientnum);

	titlebar.style.borderLeft = "1em solid #8899DD";
	titlebar.style.borderBottom = "3px solid #8899DD";
	titlebar.style.paddingLeft = "3px";
	titlebar.style.fontWeight = "bold";

	streamdoc.appendChild(titlebar);
	streamdoc.appendChild(mktext("this is a test... hurray"));

	/* Hide it for now */
	streamdoc.style.display="none";
	streamdoc.style.opacity = 0;

	document.getElementById("container").appendChild(streamdoc);

	return streamdoc;
}/*}}}*//*}}}*/

/*
 * Page Generation Functions
 */

Pimp.updateStreamList = function(params) {/*{{{*/
	var idx = 0;
	var i;

	var updates = [];

	//debug("Updating streams");
	for (i in params) {
		Pimp.updateStreamListEntry(i, params[i], idx);
		updates.push("stream:" + i);
		idx++;
	}

	// Blow away old streams that aren't listed anymore
	var table = document.getElementById("streamlist_table");
	for (i = 0; i < table.childNodes.length; i++) {
		var el = table.childNodes[i];
		if (el.id) {
			var found = 0
				for (var x = 0; x < updates.length && !found; x++) {
					if (updates[x] == el.id)
						found = 1;
				}

			if (!found)
				table.removeChild(el);
		}
	}

}/*}}}*/

Pimp.updateStreamListEntry = function(name, data, idx) {/*{{{*/
	Pimp.streams[name] = data
	Pimp.updateStreamListElement(name, idx);
}/*}}}*/

Pimp.updateStreamListElement = function(name, idx) {/*{{{*/
	var streaminfo = Pimp.streams[name];

	var list = document.getElementById("streamlist");
	var table = document.getElementById("streamlist_table");
	var streamentry = document.getElementById("stream:" + name);

	var currentsong  = Pimp.prettysong(streaminfo["song"]);
	var basename = "stream:" + name;
	if (streamentry) {
		//XXX; Put this in an Interface class/objecty thing?
		var songelement  = document.getElementById(basename + ":song");
		var clientselement  = document.getElementById(basename + ":clients");

		if (currentsong == songelement.childNodes[0].nodeValue)
			return;

		var newsongel = mkelement("div");
		newsongel.id = basename + ":song";

		/* HACK: Keep the new element from normally occupying any data */
		//newsongel.style.position = "relative";
		//newsongel.style.top = "-1em";
		/* WHY DOES THIS WORK!? */
		//newsongel.style.height = "0em"; 

		newsongel.appendChild(mktext(currentsong));
		newsongel.style.display="none";

		//var myheight = songelement.parentNode.offsetHeight;
		//songelement.parentNode.style.height = myheight + "px";
		//songelement.parentNode.style.overflow = "hidden";

		songelement.parentNode.appendChild(newsongel);

		Effect.Fade(songelement, 1000, function () {
						songelement.parentNode.removeChild(songelement);
						//newsongel.style.top = "auto";
						//newsongel.style.height = "auto";
						//delete(songelement.parentNode.style["top"]);
						//delete(songelement.parentNode.style["height"]);
						Effect.Appear(newsongel, 1000);
						});

		//songelement.childNodes[0].nodeValue = currentsong;
		//clientselement.childNodes[0].nodeValue = streaminfo["streaminfo"]["clients"];
	} else {
		var streamrow = mkelement("tr");
		var streamname = mkelement("td");
		var streamsong = mkelement("td");
		var streamclients = mkelement("td");

		streamname.style.width="8em";

		streamrow.className = (idx % 2) ? "even" : "odd";

		var tmpfunc = function(tag, val){
			var el = mkelement(tag);
			el.appendChild(mktext(val));
			return el;
		};

		var namediv = tmpfunc("div", name.substr(8));
		var songdiv = tmpfunc("div", currentsong);
		var clientdiv = tmpfunc("div", streaminfo["streaminfo"]["clients"]);

		streamname.appendChild(namediv);
		streamsong.appendChild(songdiv);
		streamclients.appendChild(clientdiv);
		streamrow.id = basename;
		namediv.id = basename + ":name";
		songdiv.id = basename + ":song";
		clientdiv.id = basename + ":clients";

		streamrow.addEventListener(clickevent, Pimp.drilldown_stream, false);

		streamrow.appendChild(streamname);
		streamrow.appendChild(streamsong);
		streamrow.appendChild(streamclients);

		if (Pimp.initdone) {
			streamrow.style.opacity = 0;
			Effect.Appear(streamrow, 1000)
		}

		// Append to table
		table.appendChild(streamrow)
	}
}/*}}}*/

/*
 * Interfacey things
 */

Pimp.drilldown_stream = function() {/*{{{*/
	Pimp.mystream = this.id.substr(7);

	debug("Drilling into " + Pimp.mystream);

	var pane = document.getElementById("streamlist_pane");
	Pimp.loadstream(Pimp.mystream);
	Effect.Fade(pane, 1000);
}

window.addEventListener("load", Pimp.init, false);
