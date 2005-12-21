


Effect = {
	'Fade': function (obj, time, func) {
		if (!obj.style.opacity)
			obj.style.opacity = 1;

		var endfunc = function() {
			debug("FadeObj: " + obj);
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
			debug("AppearObj: " + obj);
			if (func)
				func();
		};

		var a = new Accelimation(obj.style, "opacity", 1, time, 1, "");
		a.onend = endfunc;
		a.start();
	}
}

