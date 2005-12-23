
function dbg(txt) {
	document.body.appendChild(mktext(txt + " | "));
}

function getOffset(el,prop) {
	var o;
	if (prop == "width") o = el.offsetWidth;
	else if (prop == "height") o = el.offsetHeight;
	else if (prop == "top") o = el.offsetTop;
	else if (prop == "left") o = el.offsetLeft;

	return parseInt(o);
}

function clone(o) {
	var x;
	var type = typeof(o);

	if (type == "object") {
		x = {};
		for (var i in o) {
			x[i] = clone(o[i]);
		}
	} else {
		x = o;
	}

	return x;
}

Effect = {
	'Fade': function (obj, time, func) {
		if (!obj.style.opacity)
			obj.style.opacity = 1;

		var endfunc = function() {
			//debug("FadeObj: " + obj);
			obj.style.display = "none";
			if (func)
				func();
		};

		var a = new Accelimation(obj.style, "opacity", 0, time, 1, "");
		a.onend = endfunc;
		a.start();
	},

	'Appear': function (obj, time, func) {
		if (!obj.style.opacity)
			obj.style.opacity = 0;

		if (obj.style.display == "none")
			obj.style.display = "block";

		var endfunc = function() {
			//debug("AppearObj: " + obj);
			if (func)
				func();
		};

		var a = new Accelimation(obj.style, "opacity", 1, time, 1, "");
		a.onend = endfunc;
		a.start();
	},

	'FadeText': function (obj, time, newtext, func) {
		var text;

		for (var i = 0; i < obj.childNodes.length; i++) {
			var el = obj.childNodes[i];
			if (el.nodeType == el.TEXT_NODE) {
				text = el;
				break;
			}
		}

		Effect.Fade(obj, time / 2, function() {
						text.nodeValue = newtext;
						Effect.Appear(obj, time / 2, func);
						});
	},

	'Zoom': function(obj, time, opts, func) {

		if (!opts["width"] || !opts["height"])
			return;

		opts["to"] = opts["width"];
		opts["prop"] = "width";
		Effect.ZoomElement(obj, time, clone(opts), func);

		opts["to"] = opts["height"];
		opts["prop"] = "height";
		Effect.ZoomElement(obj, time, clone(opts), func);

		opts["to"] = parseInt(obj.style.left) - (opts["width"] / 2);
		opts["prop"] = "left";
		Effect.ZoomElement(obj, time, clone(opts), func);

		opts["to"] = parseInt(obj.style.top) - (opts["height"] / 2);
		opts["prop"] = "top";
		Effect.ZoomElement(obj, time, clone(opts), func);

	},

	'ZoomElement': function(obj, time, opts, func) {
		if (!opts["max"])
			opts["max"] = .20;

		if (opts["max"] < 0)
			return;

		var offset;
		var cur = obj.style[opts["prop"]];
		if (!cur)
			cur = getOffset(obj, opts["prop"]);

		cur = parseInt(cur);

		var delta = cur - opts["to"]
		if (delta < 0)
			offset = delta * opts["max"];
		else
			offset = delta * opts["max"];

		if (opts["appear"]) {
			obj.style.opacity = 0
			Effect.Appear(obj, time*2);
		}
		var accel = new Accelimation(obj.style, opts["prop"], opts["to"] - offset, time, 1);
		accel.onend = function() {
			var x;
			x = new Accelimation(obj.style, opts["prop"], opts["to"], time, 1);
			x.onend = function() {};
			x.start();
		}
		accel.start();

	},
}

