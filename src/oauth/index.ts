// oAuth server

import express, {Express} from "express";
import ip from "ip"
import {Server} from "net";
import {Globals} from "../Globals.js";

type OnCodeGetCallback = (code: string) => void
type ClientConfig = {id: string, secret: string}
export class OAuthServer {
	private server: Express = express();
	private httpServer: Server | null = null

	private readonly onCodeGet: OnCodeGetCallback

	constructor(onCodeGet: OnCodeGetCallback) {
		this.onCodeGet = onCodeGet
		this.init()
	}

	start() {
		this.httpServer = this.server.listen(13370)
	}

	stop() {
		if (!this.httpServer) return

		this.httpServer.close()
		this.httpServer = null
	}

	private init() {
		this.server.get("/", (req, res) => {
			const params = new URLSearchParams()
			params.append("response_type", "code")
			params.append("client_id", Globals.getConfig().client.id)

			res.redirect(`https://oauth.yandex.ru/authorize?${params.toString()}`)
		})

		this.server.get("/callback", (req, res) => {
			this.onCodeGet(req.query.code as string)

			res.send([
				"<div>",
				`	<h1 style="font-family: 'Arial Black',serif; font-size: xx-large">Successfully authorized!</h1>`,
				`	<p style="font-family: 'Arial',serif; font-size: large">Now you can use Yandex-Homekit freely :)</p>`,
				"</div>"
			].join(""))
		})
	}
}