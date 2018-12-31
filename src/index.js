const log = require("./services/log")("index")
const debugMongo = require("debug")("mongo")
import cors from "cors"
import config from "./config"
import express from "express"
import http from "http"
import path from "path"
import bodyParser from "body-parser"
import morgan from "morgan"
import mongoose from "mongoose"
import util from "util"
import seeder from "./seeder"
import { API } from "./api"

// CONNECT TO DATABASE
// ====================================================================================
mongoose.Promise = global.Promise
mongoose.connect(
	process.env.MONGODB_URI,
	{ useMongoClient: true }
)
mongoose.connection.on("error", () => {
	throw new Error(`unable to connect to database: ${process.env.MONGODB_URI}`)
})
if (process.env.NODE_ENV !== "production") {
	mongoose.set("debug", (collectionName, method, query, doc) => {
		debugMongo(
			`${collectionName}.${method}`,
			util.inspect(query, false, 20),
			doc
		)
	})
}
seeder.seedAll()

// APP SETUP
// ====================================================================================
const app = express()

console.log(process.env.CORS.split(","))

app.use(
	cors({
		origin: process.env.CORS ? process.env.CORS.split(",") : [],
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true
	})
)

// initialise middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")) // logging
app.use(bodyParser.json({ type: "*/json", limit: "9MB" }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(process.env.API_PREFIX ? process.env.API_PREFIX : "", API())

// SERVER SETUP
// ====================================================================================
const port = config.PORT
const server = http.createServer(app)

server.listen(port)

log.info("Server listening on: ", port)
