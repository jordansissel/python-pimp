var interface_type = "workstation";

// For future touchscreen portability
if (interface_type == "workstation") {
	clickevent = "click";
} else {
	clickevent = "mousedown";
}

Pimp = {}
Pimp.initdone = 0;

function chr(val) { return unescape("%" + val.toString(16)); }

Pimp.init = function() {/*{{{*/
	Pimp.streams = {};

	Pimp.liststreams();
	Pimp.interval(Pimp.liststreams, 3000)

	setTimeout(function() { Pimp.initdone = 1 }, 3000);
	
	document.onkeypress = function(e) { 
		var k = chr(e.charCode);

		if (k == '9') {
			debug("Reconstituting....");
			Effect.Fade(Pimp.currentpane, 1000, 
				function() {
					Pimp.showpane("streamlist_pane");
					//var el = document.getElementById("streamlist_pane");
					//if (el) Effect.Appear(el, 1000);
				})
		} else if (k == '8') {
			var d = document.getElementById("debug");
			d.style.display = (d.style.display == "none") ? "block" : "none";
		}
	};

	var searchfield = document.getElementById("query");
	var searchbutton = document.getElementById("search");

	searchfield.addEventListener("keypress",
		function(e) {
			if (e.keyCode == 13) 
				Pimp.dosearch();
			return true;
		}, true);

	searchbutton.addEventListener(clickevent, Pimp.dosearch, false);

	Pimp.currentpane = document.getElementById("streamlist_pane");
}/*}}}*/

/*
 * Helper Functions
 */
Pimp.interval = function(func, timeout) {/*{{{*/
	//debug("Calling func in " + timeout + "ms");
	setTimeout( function() { func(); Pimp.interval(func, timeout) }, timeout);
}/*}}}*/

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

Pimp.nextsong = function() {/*{{{*/
	debug("calling next song on: " + Pimp.mystream);
	callrpc("next_song", {"stream":Pimp.mystream}, Pimp.callback_nextsong);
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
}/*}}}*/

Pimp.callback_nextsong = function(params) {/*{{{*/
	/* Update the stream info page with new song data */
	Pimp.updateStreamInfo(params);
}/*}}}*/

Pimp.callback_search = function(params) {/*{{{*/
	Pimp.showSearchResults(params);
}/*}}}*/

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

		newsongel.appendChild(mktext(currentsong));
		newsongel.style.display="none";

		songelement.parentNode.appendChild(newsongel);

		Effect.Fade(songelement, 1000, function () {
						songelement.parentNode.removeChild(songelement);
						Effect.Appear(newsongel, 1000);
						});
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

Pimp.showStreamPane = function(params) {/*{{{*/
	var streamdoc = Pimp.getStreamPane({'stream': Pimp.mystream});
}/*}}}*/

Pimp.getStreamPane = function(params) {/*{{{*/
	var streamdoc = document.getElementById("streaminfo_pane");
	
	if (!streamdoc) {
		streamdoc = mkelement("div");
		streamdoc.id = "streaminfo_pane";

		var titlebar = mkelement("div");
		var titlename = mkelement("div");
		titlename.id = "streaminfo:title";
		titlename.appendChild(mktext("PLACEHOLDER"));
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
		var playing = mkelement("div");
		//playing.appendChild(mktext("Currently Playing: " + Pimp.prettysong(params["song"])));
		playing.appendChild(mktext("PLACEHOLDER"));
		playing.id = "streaminfo:currentsong";
		streamdoc.appendChild(playing);

		/* Generate the control buttons */
		var button_next = mkelement("span");
		button_next.appendChild(mktext("<<NEXT SONG>>"));
		button_next.addEventListener("click", Pimp.nextsong, false);
		button_next.style.fontWeight = "bold";
		button_next.style.right = "50px;";
		button_next.style.cursor = "pointer";
		button_next.style.padding = "3px";
		button_next.style.paddingLeft = "5px";
		button_next.style.paddingRight = "5px";

		streamdoc.appendChild(button_next);
		document.getElementById("container").appendChild(streamdoc);
	}

	/* Hide it for now */
	streamdoc.style.display="none";
	streamdoc.style.opacity = 0;

	var playing = document.getElementById("streaminfo:currentsong");
	var title = document.getElementById("streaminfo:title");

	playing.childNodes[0].nodeValue = "Currently Playing: " + Pimp.prettysong(params["song"]);
	title.childNodes[0].nodeValue = params["name"] + " (" + params["path"] + ")";

	return streamdoc;
}/*}}}*/

Pimp.updateStreamInfo = function(params) {/*{{{*/
	var playing = document.getElementById("streaminfo:currentsong");
	//Object.dpDump(params);
	Effect.FadeText(playing, 1500, "Current Song: " + Pimp.prettysong(params["songdata"]));
}/*}}}*/

Pimp.showSearchResults = function(params) {/*{{{*/
	var d = document.getElementById("search_pane");
	var found = 1;

	if (!d) {
		d = mkelement("div");
		d.id = "search_pane";
		found = 0;
	} else {
		delete_children(d);
	}
	
	d.style.border = "1px outset black";
	d.style.backgroundColor = "#EFF4FF";
	d.style.opacity = 0;

	for (var i = 0; i < params.length; i++) {
		var sr = mkelement("div");
		sr.appendChild(mktext(Pimp.prettysong(params[i])));
		sr.className = (i % 2) ? "even" : "odd";
		d.appendChild(sr);
	}

	if (!found)
		document.getElementById("container").appendChild(d);
}/*}}}*/

/*
 * Interfacey things
 */

Pimp.drilldown_stream = function() {/*{{{*/
	Pimp.mystream = this.id.substr(7);

	debug("Drilling into " + Pimp.mystream);

	var pane = document.getElementById("streamlist_pane");
	Pimp.loadstream(Pimp.mystream);

	Effect.Fade(pane, 1000, function() { Pimp.showpane("streaminfo_pane", 1); } );
}/*}}}*/

Pimp.showpane = function(pane, loop) {/*{{{*/
	var e = document.getElementById(pane);
	if (!loop)
		loop = 0

	if (!e) {
		if (loop) {
			debug("Waiting for '"+pane+"' to manifest itself...");
			setTimeout( function() { Pimp.showpane(pane, loop) }, 100);
		}
		return;
	}

	//if (e == Pimp.currentpane)
		//return;

	//if (e.style.display == "none")
		//e.style.display="block";
	Effect.Appear(e, 1000);
	Pimp.currentpane = e;
}/*}}}*/

Pimp.dosearch = function() {/*{{{*/
	var q = document.getElementById("query").value;

	if (q.length == 0)
		return;

	Effect.Fade(Pimp.currentpane, 1000, function() { Pimp.showpane("search_pane", 1); } );
	callrpc("search", {any: q}, Pimp.callback_search);
}/*}}}*/

/* Stuff to do once we're loaded! */
window.addEventListener("load", Pimp.init, false);
