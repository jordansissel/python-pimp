


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

}

