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

	var home = document.getElementById("button_home");
	Pimp.addbutton(home, Pimp.click_home);

	var debug = document.getElementById("button_debug");
	Pimp.addbutton(debug, Pimp.toggledebug, 1);

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

	if (name == Pimp.mystream) {
		Pimp.updateStreamInfo({"songdata": Pimp.streams[name]["song"]})
	}
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
	if (playing) {
		var str = "Current Song: " + Pimp.prettysong(params["songdata"]);
		if (playing.childNodes[0].nodeValue != str)
			Effect.FadeText(playing, 1500, str);
	}
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
			//Pimp.waiting();
			setTimeout( function() { Pimp.showpane(pane, loop) }, 100);
		}
		return;
	}

	debug("Showing '"+pane+"'");
	Effect.Appear(e, 1000, function() { debug("Done showing '"+pane+"'"); });
	Pimp.currentpane = e;
}/*}}}*/

Pimp.dosearch = function() {/*{{{*/
	var q = document.getElementById("query").value;

	if (q.length == 0)
		return;

	Effect.Fade(Pimp.currentpane, 1000, function() { Pimp.showpane("search_pane", 1); } );
	callrpc("search", {any: q}, Pimp.callback_search);
}/*}}}*/

Pimp.click_home = function() {
	Effect.Fade(Pimp.currentpane, 1000, 
		function() {
			Pimp.showpane("streamlist_pane");
		});
}

Pimp.addbutton = function(obj, func) {

	if (!Pimp.buttonoffset)
		Pimp.buttonoffset = 25;

	obj.style.cursor = "pointer";
	obj.style.width = "0px";
	obj.style.height = "0px";
	obj.style.top = "25px";
	obj.style.left = (parseInt(document.body.offsetWidth) - Pimp.buttonoffset) + "px";
	debug("Left: " + obj.style.left);
	obj.style.position = "absolute";
	obj.style.display = "block";

	if (typeof(func) == "function")
		obj.addEventListener(clickevent, function() {
									Effect.ZoomOut(this, 300);
									if (typeof(func) == "function") func();
									}, false);

	setTimeout(function() {
		Effect.Zoom(obj, 300, {'appear':1, "width": 50, "height": 50});
	}, 200);

	Pimp.buttonoffset += 50;
}

Pimp.toggledebug = function() {
	var d = document.getElementById("debug");
	if (d.style.display == "none") {
		//Effect.Appear(d, 500);
		d.style.display = "block";
		var a = new Accelimation(d.style, "height", 8, 500, 1, "em");
		//a.onend = function() { d.style.display = "block"; }
		a.start();
	} else {
		//Effect.Fade(d, 500);
		var a = new Accelimation(d.style, "height", 0, 500, 1, "em");
		a.onend = function() { d.style.display = "none"; }
		a.start();
	}
}

/* Stuff to do once we're loaded! */
window.addEventListener("load", Pimp.init, false);
