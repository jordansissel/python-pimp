var xmlrpc;

function loadfunc() {
	var clicky = document.getElementById("test");
	clicky.addEventListener("click", clickfunc, false);
}

function clickfunc() {
	debug("Calling xmlrpc method with '12' and '15' as params")
	call_xmlrpc("search", {any: "nightwish"}, click_callback)
}

function xmlrpc_callback() {
	if (xmlrpc.readyState == 4) {
		var doc = xmlrpc.responseXML;
		if (doc.childNodes[0].tagName != "methodResponse") {
			debug("UNEXPECTED NON-XMLRPC RESPONSE FROM SERVER");
			return;
		}

		//debug(xmlrpc.responseText)
		var hash = rpcparam2hash(doc.childNodes[0])
		Object.dpDump(hash)

		xmlrpc.mycallback(hash)
	}
}

function click_callback(params) {
	for (var i in params[0]) {
		debug("params[0]["+i+"] = "+params[0][i])
	}
}

function call_xmlrpc(method, args, callback) {
	xmlrpc = new XMLHttpRequest();
	xmlrpc.open("POST", "/xmlrpc/control", true);
	xmlrpc.setRequestHeader("Content-type", "text/xml");

	var xml = "<methodCall>"
	xml += "<methodName>" + method + "</methodName>"
	xml += "<params><param>"
	xml += "<value>"
	xml += hash2rpcparam(args);
	xml += "</value>"
	xml += "</param></params>"
	xml += "</methodCall>"

	xmlrpc.onreadystatechange = xmlrpc_callback;
	xmlrpc.mycallback = callback
	xmlrpc.send(xml);
}

function debug(val) {
	var list = document.getElementById("streamlist");
	var foo = document.createElement("div")
	var text = document.createTextNode(val);
	foo.style.fontWeight="bold";
	foo.appendChild(text)
	list.appendChild(foo)
}

/*
 * Marshall a javascript dictionary into an XMLRPC document
 */

function hash2rpcparam(h) {
	var xml = "<!-- " + h + "-->";
	xml += "<struct>";
	for (key in h) {
		xml += "<member>";
		xml += "<name>" + key + "</name>";
		xml += "<value><string>" + h[key] + "</string></value>";
		xml += "</member>";
	}
	xml += "</struct>";

	return xml
}

/*
 * Marshall an XMLRPC document into a JavaScript structure
 */
function rpcparam2hash(doc) {
	var rpc;
	if (doc.tagName == "methodResponse" || doc.tagName == "array") {
		rpc = Array()
		for (var i = 0; i < doc.childNodes.length; i++) {
			var myparam
			//debug("Type: " + doc.childNodes[i].nodeName)
			myparam = rpcparam2hash(doc.childNodes[i])
			rpc.push(myparam)
		}
		//Object.dpDump(rpc)
	} else if (doc.tagName == "value") {
		var child = doc.childNodes[0]; // only one child of value
		if (child.tagName == "i4" || child.tagName == "int"
			 || child.tagName == "string" || child.tagName == "boolean"
			 || child.tagName == "double") {
			//debug("Convert ("+child.tagName+"): " + child.childNodes[0].nodeValue)
			rpc = child.childNodes[0].nodeValue;
		} else if (child.tagName == "struct") {
			rpc = Array()
			//debug("Struct length: " + child.childNodes.length)
			for (var x = 0; x < child.childNodes.length; x++) { // member node
				//debug("Run: " + x + " / " + child.childNodes.length)
				var name;
				var value;
				var node = child.childNodes[x]
				if (node.nodeName == "member") {
					//debug("Struct: " + node.nodeName)
					for (var y = 0; y < node.childNodes.length; y++) { // name or value
						var mynode = node.childNodes[y]
						if (mynode.tagName == "name") {
							name = mynode.childNodes[0].nodeValue
							//debug("--> Member(name): " + name)
						} else if (mynode.tagName == "value") {
							value = rpcparam2hash(mynode);
							//debug("--> Member(value): " + value)
						} else {
							//debug("Unknown (in struct): " + mynode.nodeName)
						}
					}
					//debug("Storing: " + name + " => " + value)
					rpc[name] = value
				}
			}
		} else {
			/* Nothing happens if we hit an element we don't know */
		}
	} else {
		//debug("Unknown node: " + doc)
	}

	return rpc
}

window.onload = loadfunc
