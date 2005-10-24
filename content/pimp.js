var xmlrpc;

function loadfunc() {
	var clicky = document.getElementById("test");
	clicky.addEventListener("click", clickfunc, false);
}

function clickfunc() {
	call_xmlrpc("control", {test: "foo"}, click_callback)
}

function xmlrpc_callback() {
	if (xmlrpc.readyState == 4) {
		doc = xmlrpc.responseXML;
		if (doc.childNodes[0].tagName != "methodResponse") {
			debug("UNEXPECTED NON-XMLRPC RESPONSE FROM SERVER");
			return;
		}

		debug(xmlrpc.responseText)
		hash = rpcparam2hash(doc.childNodes[0])
		debug("Hash: " + hash)

		xmlrpc.mycallback(hash)
	}
}

function click_callback(params) {
	debug(params)
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

function rpcparam2hash(doc) {
	rpc = Array()
	if (doc.tagName == "methodResponse") {
		for (var i = 0; i < doc.childNodes.length; i++) {
			debug("Type: " + doc.childNodes[i].nodeName)
			rpc.push(rpcparam2hash(doc.childNodes[i]))
		}
	} else if (doc.tagName == "value") {
		child = doc.childNodes[0]; // only one child of value
		if (child.tagName == "i4" || child.tagName == "int"
			 || child.tagName == "string" || child.tagName == "boolean"
			 || child.tagName == "double") {
			debug("Convert ("+child.tagName+"): " + child.childNodes[0].nodeValue)
			rpc.push(child.childNodes[0].nodeValue);
		} else if (child.tagName == "struct") {
			tmphash = Array()
			for (var x = 0; x < child.childNodes.length; x++) { // member node
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
				}
				//debug(name + " => " + value)
				tmphash[name] = value
				var a = "";
				debug("SO FAR");
				for (abc in tmphash) {
					debug("Progress: " + abc)
				}
			}
			debug("Struct: " + tmphash)
			rpc.push(tmphash);
		}
	} else {
		debug("Unknown node: " + doc)
	}

	return rpc
}

window.onload = loadfunc
