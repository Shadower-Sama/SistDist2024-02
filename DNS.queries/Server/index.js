import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { Resolver } from "node:dns";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "9.9.9.9"]);

const packageDefinition = protoLoader.loadSync("proto/dns.proto", {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});

const dns_rpc = grpc.loadPackageDefinition(packageDefinition).dns;

const resolve = async (call, callback) => {
	const url = call.request.url;

	resolver.resolve4(url, (err, addresses) => {
		if (err) console.log(err);

		callback(null, { addresses: addresses });
	});
};

const server = new grpc.Server();

server.addService(dns_rpc.DNS.service, {
	Resolve: resolve,
});

server.bindAsync(
	"0.0.0.0:50051",
	grpc.ServerCredentials.createInsecure(),
	(err) => {
		if (err) throw err;

		console.log("gRPC server listening to port 50051");
	},
);