
function dbg(txt) {
	var d = mkelement("div");
	d.appendChild(mktext(txt));
	document.body.appendChild(d);
}

function getOffset(el,prop) {
	//var o = parseInt(el.style[prop]);
	//if (o) return o;;

	var o = 0;
	var key;
	if (prop == "width") key = "offsetWidth";
	else if (prop == "height") key = "offsetHeight";
	else if (prop == "top") key = "offsetTop";
	else if (prop == "left") key = "offsetLeft";

	while (el.offsetParent) {
		o += parseInt(el[key]);
		el = el.offsetParent;
	}
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

		if (!opts["width"] || !opts["height"]) {
			dbg("Missing width or height arguments");
			return;
		}
		if (opts["appear"]) {
			obj.style.opacity = 0
			Effect.Appear(obj, time*2);
		} else if (opts["fade"]) {
			//obj.style.opacity = 0
			Effect.Fade(obj, time*2);
		}

		opts["to"] = opts["width"];
		opts["prop"] = "width";
		Effect.ZoomElement(obj, time, clone(opts), func);

		opts["to"] = opts["height"];
		opts["prop"] = "height";
		Effect.ZoomElement(obj, time, clone(opts));

		opts["to"] = getOffset(obj, "left") - ((opts["width"] - getOffset(obj, "width")) / 2);
		opts["prop"] = "left";
		Effect.ZoomElement(obj, time, clone(opts));

		opts["to"] = getOffset(obj, "top") - ((opts["height"] - getOffset(obj, "height")) / 2);
		//opts["to"] = getOffset(obj, "top") - (opts["height"] / 2);
		opts["prop"] = "top";
		Effect.ZoomElement(obj, time, clone(opts));

	},

	'ZoomElement': function(obj, time, opts, func) {
		if (!opts["max"])
			opts["max"] = .20;

		if (opts["max"] < 0)
			return;

		var offset;
		var cur = getOffset(obj, opts["prop"]);

		var delta = cur - opts["to"]
		if (delta < 0)
			offset = delta * opts["max"];
		else
			offset = delta * opts["max"];

		//dbg(opts["prop"] + ": " + cur + " -> " + opts["to"]);
		var accel = new Accelimation(obj.style, opts["prop"], opts["to"] - offset, time, 1);
		accel.onend = function() {
			var x;
			x = new Accelimation(obj.style, opts["prop"], opts["to"], time, 1);
			x.onend = function() {
				if (typeof(func) == "function")
					func();
			};
			x.start();
		}
		accel.start();
	},

	'ZoomOut': function(obj, time, func) {
		var copy = obj.cloneNode(1);

		/* Scrample the id */
		copy.id = "I live to die. No." +  Math.random();
		//copy.style.overflow = "hidden";
		copy.style.position = "absolute";
		copy.style.display = "none";
		copy.style.left = getOffset(obj, "left") + "px";
		copy.style.top = getOffset(obj, "top") + "px";
		copy.style.width = getOffset(obj, "width") + "px";
		copy.style.height = getOffset(obj, "height") + "px";
		copy.style.display = "block";
		obj.parentNode.appendChild(copy);

		var width = parseInt(copy.style.width) * 2
		var height = parseInt(copy.style.height) * 2

		Effect.Zoom(copy, time, {"width": width, "height": height, "fade": 1}, 
						function() {
							obj.parentNode.removeChild(copy);
						});
	}
}

