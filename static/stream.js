
/* Stream information */

function Stream(name) {
	this.queue = []
	this.recentplays = [];
	this.maxrecent = 5;
	this.name = name;
}

Stream.prototype.update = function(data) {
	if (data.song) this.updatesong(data.song);
	if (data.streaminfo) this.updateinfo(data.streaminfo);
}

Stream.prototype.updatesong = function(song) {
	if (this.isnewsong(song)) {
		this.recentplays.push(this.currentsong)
		if (this.recentplays.length > this.maxrecent)
			this.recentplays.splice(1,5);
		this.currentsong = song;
		if (typeof(this.callback_newsong) == "function")
			this.callback_newsong()
	}
}

Stream.prototype.isnewsong = function(song) {
	if (!this.currentsong)
		return 1;

	if (song.playid != this.currentsong.playid)
		return 1;

	return 0;
}

Stream.prototype.setupdatecallback = function(func) {
	if (typeof(func) == "function")
		this.callback_newsong = func;
}

Stream.prototype.updateinfo = function(streaminfo) {
	this.numclients = streaminfo.clients;
}

Stream.prototype.updatequeue = function(queue) {
	this.queue = queue;
}
