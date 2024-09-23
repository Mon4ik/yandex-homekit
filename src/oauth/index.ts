// oAuth server

import express, { Express } from "express";
import ip from "ip"
import { Server } from "net";
import { Globals } from "../Globals.js";
import { YandexAPI } from "../yandex/api.js";

type OnCodeGetCallback = (code: string) => void
type ClientConfig = { id: string, secret: string }

export class OAuthServer {
    private api = new YandexAPI()
    private server: Express = express();
    private httpServer: Server | null = null

    private readonly onCodeGet: OnCodeGetCallback
    private stopped = false

    constructor() {
        this.init()
    }

    start(port: number) {
        this.httpServer = this.server.listen(13370)
    }

    wait() {
        return new Promise<void>((res) => {
            setInterval(() => {
                if (this.stopped) {
                    this.httpServer.close(() => res())
                }
            }, 1000)
        })
    }

    private init() {
        this.server.get("/", (req, res) => {
            const params = new URLSearchParams()
            params.append("response_type", "code")
            params.append("client_id", Globals.getConfig().client.id)

            res.redirect(`https://oauth.yandex.ru/authorize?${params.toString()}`)
        })

        this.server.get("/callback", async (req, res) => {
            await this.api.exchangeToken(req.query.code as string)
            this.stopped = true

            res.send([
                "<div>",
                `	<h1 style="font-family: 'Arial Black',serif; font-size: xx-large">Successfully authorized!</h1>`,
                `	<p style="font-family: 'Arial',serif; font-size: large">Now you can execute <code style="padding: 6px; border-radius: 5px;">yandex-homekit start ...</code> to start the bridge.</p>`,
                "</div>"
            ].join(""))
        })
    }
}
