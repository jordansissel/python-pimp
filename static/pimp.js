var interface_type = "workstation";

/*XXX: SHOW PROPERTIES
for (var i in results) {
	debug("td: " + i + ": " + results[i]);
}
*/

// For future touchscreen portability?
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
	Pimp.currentpane = document.getElementById("streamlist_pane");

	Pimp.wait = {};
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

}/*}}}*/

/*
 * Helper Functions
 */
Pimp.interval = function(func, timeout) {/*{{{*/
	//debug("Calling func in " + timeout + "ms");
	setTimeout( function() { func(); Pimp.interval(func, timeout) }, timeout);
}/*}}}*/

Pimp.waitfor = function(obj, prop, value, func) {/*{{{*/
	if (obj[prop] == value) {
		func();
	} else {
		setTimeout(function() { Pimp.waitfor(obj, prop, value, func) }, 100);
	}
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
	/* Only list streams if 'streamlist_pane' is in view */
	if (Pimp.currentpane.id == "streamlist_pane")
		callrpc("list_streams", {}, Pimp.callback_liststreams);
	else if (Pimp.currentpane.id == "streaminfo_pane")
		Pimp.loadstream(Pimp.mystream);

}/*}}}*/

Pimp.loadstream = function(name) {/*{{{*/
	callrpc("loadstream", {"stream":name}, Pimp.callback_loadstream);
}/*}}}*/

Pimp.click_nextsong = function(e) {/*{{{*/
	//debug("calling next song on: " + Pimp.mystream + " / ::: " + this);
	callrpc("next_song", {"stream":Pimp.mystream}, Pimp.callback_nextsong);
	Effect.ZoomOut(e.target, 300);
}/*}}}*/

Pimp.click_prevsong = function(e) {/*{{{*/
	//debug("calling prev song on: " + Pimp.mystream);
	//callrpc("next_song", {"stream":Pimp.mystream}, Pimp.callback_nextsong);
	Effect.ZoomOut(e.target, 300);
}/*}}}*/

Pimp.click_home = function() {/*{{{*/
	Pimp.showpane("streamlist_pane");
}/*}}}*/

Pimp.click_enqueue = function() {/*{{{*/
	debug("enqueue");

	var enq = document.getElementById("queuepage");
	var list = [];

	for (var i = 0; i < enq.childNodes.length; i++) {
		list.push(enq.childNodes[i].songid);
	}

	if (Pimp.mystream)
		callrpc("enqueue", {stream: Pimp.mystream, list: list}, Pimp.callback_enqueue);
	else
		debug("I don't have a stream to enqueue this too");
}/*}}}*/
/*
 * RPC Callbacks
 */

Pimp.callback_liststreams = function(params) {/*{{{*/
	Pimp.updateStreamList(params);
}/*}}}*/

Pimp.callback_loadstream = function(params) {/*{{{*/
	/* Load the stream pane in the background? */
	Pimp.getStreamPane(params);

	//debug("loadstream: " + params.path);
	if (!Pimp.streams[params.path])
		Pimp.streams[params.path] = new Stream(params.path);

	Pimp.streams[params.path].updatesong(params.song);
	Pimp.streams[params.path].updatequeue(params.queue);

	var playing = document.getElementById("streaminfo:currentsong");
	var recent = document.getElementById("streaminfo:recent");

	Pimp.updateStreamInfo(params);
}/*}}}*/

Pimp.callback_nextsong = function(params) {/*{{{*/
	/* Update the stream info page with new song data */
	Pimp.updateStreamInfo(params);
}/*}}}*/

Pimp.callback_search = function(params) {/*{{{*/
	Pimp.showSearchResults(params);
}/*}}}*/

Pimp.callback_enqueue = function(params) {/*{{{*/
	var but = document.getElementById("enqueuebutton");
	Pimp.removebutton(but);
}/*}}}*/

/*
 * Page Generation Functions
 */

Pimp.updateStreamList = function(params) {/*{{{*/
	var idx = 0;
	var i;

	var updates = {};

	for (i in params) {
		Pimp.updateStreamListEntry(i, params[i], idx);
		//updates.push("stream:" + i);
		idx++;
	}

}/*}}}*/

Pimp.updateStreamListEntry = function(name, data, idx) {/*{{{*/
	if (!Pimp.streams[name])
		Pimp.streams[name] = new Stream(name);

	Pimp.streams[name].updatesong(data.song);
	Pimp.streams[name].updateinfo(data.streaminfo);

	var streamname = name.substr(8);
	var stream = Pimp.streams[name];

	var streamitem = $("#streamlist");
	if (streamitem.find("#"+streamname).size() == 0) {
		$C("<tr id='"+streamname+"'><td>ph1</td><td>ph2</td><td>ph3</td></tr>")
			//.find("tr").each(function() { this.id = streamname; }).end()
			.appendTo("#streamlist tbody");
		$("#streamlist tr:gt(0):even").addClass("evenrow");
		$("#streamlist tr:gt(0):odd").addClass("oddrow");
		$("#streamlist tr").find("td:not(:first)").style("borderLeft", "1px solid black");
		stream.jquery = $("#streamlist #"+streamname);
	}

	//debug("Jquery: " + Pimp.streams[name].jquery.size());
	//debug("Jquery2: " + Pimp.streams[name].jquery.get(0));
	var currentsong = Pimp.prettysong(stream.currentsong);

	/* Only update if necessary */
	if (stream.currentsong.playid != stream.lastid) {
		// Update this particular entry */
		stream.jquery.html({
			 "td:nth(0)": name,
			 "td:nth(1)": currentsong,
			 "td:nth(2)": Pimp.streams[name].numclients
												 })
		stream.lastid = stream.currentsong.playid;
	}

}/*}}}*/

Pimp.updateStreamListElement = function(name, idx) {/*{{{*/
	var stream = Pimp.streams[name];

	var currentsong = Pimp.prettysong(stream.currentsong);
	var basename = "stream:" + name;

	var name= name.substr(8);
	var streamitem = $("#streamlist #"+name);

	if (streamitem.size() == 0) {
		$C("<tr><td>foo bar baz</td><td></td><td></td></tr>")
		.find("tr").each(function() { this.id = name; }).end()
		.appendTo("#streamlist tbody");

		// XXX: Is this necessary?
		streamitem = $("#streamlist #"+name);
	}

	/* Update the table */
	streamitem.html({
				"td:nth(0)": name,
				"td:nth(1)": currentsong,
				"td:nth(2)": stream.numclients
		})
	$("#streamlist tr:gt(0):even").addClass("evenrow");
	$("#streamlist tr:gt(0):odd").addClass("oddrow");
	$("#streamlist tr").find("td:not(:first)").style("borderLeft", "1px solid black");

	//streamrow.addEventListener(clickevent, Pimp.drilldown_stream, false);
}/*}}}*/

Pimp.showStreamPane = function(params) {/*{{{*/
	Pimp.getStreamPane({'stream': Pimp.mystream});
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

		titlebar.appendChild(titlename);
		titlebar.appendChild(clientnum);

		titlebar.style.borderLeft = "1em solid #8899DD";
		titlebar.style.borderBottom = "3px solid #8899DD";
		titlebar.style.paddingLeft = "3px";
		titlebar.style.fontWeight = "bold";

		streamdoc.appendChild(titlebar);
		var playing = mkelement("div");
		playing.id = "streaminfo:currentsong";
		playing.className = "streaminfo-currentsong";

		var recent = mkelement("div");
		recent.id = "streaminfo:recent";

		var queue = mkelement("div");
		queue.id = "streaminfo:queue";

		streamdoc.appendChild(recent);
		streamdoc.appendChild(playing);
		streamdoc.appendChild(queue);

		/* Generate the control buttons */
		var button_next = mkelement("img");
		button_next.src="/static/images/pimp-next.png";
		button_next.id = "button_next";

		var button_prev = mkelement("img");
		//button_prev.src="/static/images/pimp-prev.png";
		button_prev.id = "button_prev";

		var button_stream = mkelement("img");
		button_stream.src = "/static/images/pimp-musiclist.png";
		button_stream.id = "button_stream";

		document.getElementById("container").appendChild(streamdoc);

		/* Hide it for now */
		streamdoc.style.display="none";

		//Pimp.waitfor(streamdoc.style, "display", "block", function() {
			Pimp.addbutton(button_next, Pimp.click_nextsong, titlebar);
			Pimp.addbutton(button_prev, Pimp.click_prevsong, titlebar);
			Pimp.addbutton(button_stream, function() {}, document.getElementById("titlebar"));
		//})
	}

	Pimp.updateStreamInfo(params);

	return streamdoc;
}/*}}}*/

Pimp.updateStreamInfo = function(params) {/*{{{*/
	var playing = document.getElementById("streaminfo:currentsong");
	var recent = document.getElementById("streaminfo:recent");
	var queue = document.getElementById("streaminfo:queue");
	var stream = Pimp.streams[params["path"]];

	if (playing) {
		//debug("Foo: " + params.song);
		var str = Pimp.prettysong(params["song"]);
		if (Pimp.currentsongid != params["song"]["playid"]) {
			debug("Updating stream info");
			var sdiv = mkelement("div");
			sdiv.appendChild(mktext(Pimp.prettysong(params["song"])))
			sdiv.style.display="none";
			sdiv.style.opacity=0;

			for (var i = 0; i < playing.childNodes.length; i++) {
				recent.appendChild(playing.childNodes[i]);
			}

			while (recent.childNodes.length > stream.maxrecent) {
				recent.removeChild(recent.childNodes[0]);
			}

			/* Update the queue */
			//if (params.queue)
				//Object.dpDump(params.queue);
			delete_children(queue);
			for (var i = 0; i < params.queue.length; i++) {
				var qel = mkelement("div");
				qel.appendChild(mktext(Pimp.prettysong(params.queue[i])));
				queue.appendChild(qel);
			}

			playing.appendChild(sdiv);
			Effect.Appear(sdiv, 1500);
		}

		var title = document.getElementById("streaminfo:title");
		if (params["path"] && title) {
			title.childNodes[0].nodeValue = params["name"] + " (" + params["path"] + ")";
		}
		Pimp.currentsongid = params["song"]["playid"];
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

	//d.style.border = "1px solid black";
	d.style.backgroundColor = "#EFF4FF";

	var table = mkelement("table");
	var tr = mkelement("tr");
	var resultstd = mkelement("td");
	var newqueuetd = mkelement("td");

	var results = mkelement("div");
	var newqueue = mkelement("div");

	for (var i = 0; i < params.length; i++) {
		var result = mkelement("div");
		result.className = "searchresult";
		result.appendChild(mktext(Pimp.prettysong(params[i])));
		result.songid = params[i]["songid"];
		result.style.backgroundColor = (i % 2)  ? "#D8D8DF" : "#E8E8EF";
		result.addEventListener(clickevent, function() { newqueue.appendChild(this) }, false);
		results.appendChild(result);
	}

	resultstd.width = "50%";
	newqueuetd.width = "50%";
	results.id = "resultspage";
	newqueue.id = "queuepage";

	var h = (getOffset(document.body, "height") - 150) + "px";
	results.style.border = "1px solid black";
	newqueue.style.border = "1px solid black";

	results.style.height = newqueue.style.height = h;
	results.style.overflow = newqueue.style.overflow = "auto";

	results.vAlign="top";
	newqueue.vAlign="top";
	resultstd.appendChild(results);
	newqueuetd.appendChild(newqueue);
	tr.appendChild(resultstd);
	tr.appendChild(newqueuetd);
	table.appendChild(tr);
	d.appendChild(table);

	if (!found)
		document.getElementById("container").appendChild(d);

	var enq = mkelement("img");
	enq.src="/static/images/pimp-enqueue.png";
	enq.id="enqueuebutton";
	Pimp.addbutton(enq, Pimp.click_enqueue, document.getElementById("titlebar"));

}/*}}}*/

/*
 * Interfacey things
 */

Pimp.drilldown_stream = function() {/*{{{*/
	Pimp.mystream = this.id.substr(7);

	debug("Drilling into " + Pimp.mystream);
	Pimp.loadstream(Pimp.mystream);
	Pimp.showpane("streaminfo_pane", 1);
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

	Pimp.currentpane.style.display = "none";
	//debug("Showing '"+pane+"' / Hiding: '"+Pimp.currentpane.id+"'");
	//Effect.Appear(e, 1000, function() { debug("Done showing '"+pane+"'"); });
	e.style.display = "block";
	Pimp.currentpane = e;
}/*}}}*/

Pimp.dosearch = function() {/*{{{*/
	var q = document.getElementById("query").value;

	if (q.length == 0)
		return;

	//Effect.Fade(Pimp.currentpane, 1000, function() { Pimp.showpane("search_pane", 1); } );

	Pimp.showpane("search_pane",1);
	callrpc("search", {any: q}, Pimp.callback_search);
}/*}}}*/

Pimp.toggledebug = function() {/*{{{*/
	var d = document.getElementById("debug");
	if (d.style.display == "none") {
		//Effect.Appear(d, 500);
		d.style.display = "block";
		var a = new Accelimation(d.style, "height", 8, 500, 1, "em");
		a.onend = function() { }
		a.start();
	} else {
		//Effect.Fade(d, 500);
		var a = new Accelimation(d.style, "height", 0, 500, 1, "em");
		a.onend = function() { d.style.display = "none"; }
		a.start();
	}
}/*}}}*/

/* Stuff to do once we're loaded! */
window.addEventListener("load", Pimp.init, false);
