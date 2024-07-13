import { ws } from "./ws/server.js"
import { loadAndCallPlugin } from "./utils/loadFiles.js"
import dotenv from "dotenv"

dotenv.config()
loadAndCallPlugin(ws)
console.log(process.env.NODE_ENV)
