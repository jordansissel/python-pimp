var interface_type = "workstation";

// For future touchscreen portability?
if (interface_type == "workstation") {
	clickevent = "click";
} else {
	clickevent = "mousedown";
}

Pimp = {}

function chr(val) { return unescape("%" + val.toString(16)); }

Pimp.init = function() {/*{{{*/
	debug("Initializing...");

	/* Stream information storage */
	Pimp.streams = {};

	/* 'enter' keypress on the search field does a search */
	$("#query").keypress(function(e) {
		if (e.keyCode == 13)
			Pimp.dosearch();
		return true;
		
	});

	/* Query for a stream list */
	Pimp.liststreams();

	Pimp.interval(Pimp.liststreams, 3000);

}/*}}}*/

/*
 * Helper Functions
 */
Pimp.interval = function(func, timeout) {/*{{{*/
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
	callrpc("list_streams", {}, Pimp.callback_liststreams);
}/*}}}*/

Pimp.loadstream = function(name) {/*{{{*/
	callrpc("loadstream", {"stream":name}, Pimp.callback_loadstream);
}/*}}}*/

Pimp.click_nextsong = function(e) {/*{{{*/
	callrpc("next_song", {"stream":Pimp.mystream}, Pimp.callback_nextsong);
}/*}}}*/

Pimp.click_prevsong = function(e) {/*{{{*/
	//callrpc("next_song", {"stream":Pimp.mystream}, Pimp.callback_nextsong);
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
	//Pimp.getStreamPane(params);

	if (!Pimp.streams[params.path])
		Pimp.streams[params.path] = new Stream(params.path);

	Pimp.updateStreamInfo(params);
}/*}}}*/

Pimp.callback_nextsong = function(params) {/*{{{*/
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
		idx++;
	}

}/*}}}*/

Pimp.updateStreamListEntry = function(name, data, idx) {/*{{{*/
	if (!Pimp.streams[name])
		Pimp.streams[name] = new Stream(name);

	var streamname = name.substr(8);
	var stream = Pimp.streams[name];
	stream.update(data);

	var streamitem = $("#streamlist");
	if (!stream.jquery) {
		$C("<tr id='"+streamname+"'><td>ph1</td><td>ph2</td><td>ph3</td></tr>")
			.appendTo("#streamlist tbody");
		$("#streamlist tr:gt(0):even").addClass("evenrow");
		$("#streamlist tr:gt(0):odd").addClass("oddrow");
		$("#streamlist tr").find("td:not(:first)").style("borderLeft", "1px solid black");

		stream.jquery = $("#streamlist #"+streamname);

		stream.jquery.click(function(e) { Pimp.drilldown_stream(stream); });
	}

	/* Only update if necessary */
	if (stream.currentsong.playid != stream.lastid) {
		stream.jquery.html({
			 "td:nth(0)": name,
			 "td:nth(1)": Pimp.prettysong(stream.currentsong),
			 "td:nth(2)": stream.numclients
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

}/*}}}*/

Pimp.showStreamPane = function(params) {/*{{{*/
	Pimp.getStreamPane({'stream': Pimp.mystream});
}/*}}}*/

Pimp.updateStreamInfo = function(params) {/*{{{*/
	var streampage = $("#streaminfo_pane"); 
	
	if (streampage.size() == 0) {
		$C("<div id='streaminfo_pane'>\
				<div id='streaminfo:title'></div>\
				<div id='streaminfo:songs'></div>\
			</div>").appendTo("#container");
	}
	var songpane = $("#streaminfo:songs");

	Pimp.streams[params.path].updatesong(params.song);
	Pimp.streams[params.path].updatequeue(params.queue);

	if (songpane.size() > 0) {
		var str = Pimp.prettysong(params["song"]);
		if (Pimp.currentsongid != params["song"]["playid"]) {
			debug("Updating stream info");

			// Change current song to "past song"
			/*
			songpane.find("*[type=currentsong]").each(function() {
				this.type = "history";
			}).end().find("*[type=history]:last").after(
				$C("<div type='currentsong'>"+str+"</div>")
			);
			*/

		}

		Pimp.currentsongid = params["song"]["playid"];
	}
}/*}}}*/

Pimp.showSearchResults = function(params) {/*{{{*/
	var d = $("#search_pane")
	var found = 1;

	if (d.size() == 0) {
		d = $C("<div id='search_pane'></div>")
	} else {
		d.find('*').remove();
	}

	d.style("backgroundColor", "#EFF4FF");

	var srt = $C("table").html("<tr><td valign='top'width='50%'><div></div></td><td width='50%' valign='top'><div></div></td></tr>");

	for (var i = 0; i < params.length; i++) {
		var result = $C("div");
		result.addClass("searchresult");
		result.html(Pimp.prettysong(params[i]));
		result.set("songid", params[i]["songid"]);
		result.style("backgroundColor", (i % 2)  ? "#D8D8DF" : "#E8E8EF");
		result.onclick(function() { srt.find("td:nth(1) div").append(this); });
		debug(result.get(0).innerHTML);
		srt.find("td:nth(1)").append(result);
		//result.appendTo(srt);
	}

	//srt.style("border", "1px solid black");
	srt.set("id", "search_pane");
	//debug("Size of D: " + d.size());
	//srt.each(function() { debug(this.innerHTML) });
	d.append(srt);
	$(document.body).get(0).appendChild(srt.get(0));

	Pimp.showpane("search_pane");

}/*}}}*/

/*
 * Interfacey things
 */

Pimp.drilldown_stream = function(s) {/*{{{*/
	Pimp.mystream = s.name;
	Pimp.loadstream(Pimp.mystream);
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
$(document).ready(Pimp.init);
