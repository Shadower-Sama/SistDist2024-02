import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import express from "express";

import { createClient } from "redis";

const redisClient = await createClient({ url: "redis://redis:6379" })
	.on("error", (err) => console.log("Redis Client Error", err))
	.connect();

const packageDefinition = protoLoader.loadSync("proto/dns.proto", {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});

const dns_rpc = grpc.loadPackageDefinition(packageDefinition).dns;
// @ts-ignore
const grpcClient = new dns_rpc.DNS(
	"server:50051",
	grpc.credentials.createInsecure(),
);

const app = express();

app.get("/", async (req, res) => {
	const url = String(req.query.url);

	const cached_value = await redisClient.get(url);

	if (cached_value === null)
		grpcClient.Resolve({ url: url }, async (err, result) => {
			if (err) res.sendStatus(500);

			await redisClient.set(url, JSON.stringify(result.addresses));

			res.json({ addresses: result.addresses, cache: false });
		});
	else res.json({ addresses: JSON.parse(cached_value), cache: true });
});

app.listen(3000, () => console.log("API listening to port 3000"));