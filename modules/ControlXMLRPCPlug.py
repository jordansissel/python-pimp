
import Plug
class ControlXMLRPCPlug(Plug):
	def process(self):
		r = self.request
		data = r.rfile.read(int(r.headers["content-length"]))
		(params, method) = xmlrpclib.loads(data)

		r.send_response(200)
		r.send_header("Content-type", "text/xml")
		r.end_headers()

		rpc = RPC()
		rpc.call(method, params, r.wfile.write)


