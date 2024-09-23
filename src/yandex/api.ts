import axios, { AxiosRequestConfig } from "axios";
import qs from "qs"
import chalk from "chalk";

import { Globals } from "../Globals.js";

import type { GetDevicesResponse, YandexResponse } from "../types.js";

export class YandexAPI {
    public get token() {
        return Globals.getOauth().accessToken
    }

    public async request<T = YandexResponse<any>>(url: string, config: AxiosRequestConfig): Promise<T> {
        const resp = await axios<T & YandexResponse<any>>(Object.assign({
            url: `https://api.iot.yandex.net/v1.0${url}`,
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            validateStatus: () => true
        }, config))

        if (resp.data.status === "error" || resp.status !== 200) {
            Globals.getLogger().trace("Got error from API.", resp)
            throw Error("Error in API")
        }

        return resp.data
    }

    // IOT associated things //

    async getDevices() {
        try {
            const resp = await this.request("/user/info", {})

            return resp.devices
        } catch (e) {
            Globals.getLogger().error("Failed to get devices from yandex. Did you authorize?")
            Globals.getLogger().trace(e)
            Globals.abort()
            return []
        }
    }

    async applyActions(devices: any): Promise<true> {
        try {
            await this.request("/devices/actions", {
                method: "POST",
                data: devices
            })

            return true
        } catch (e) {
            Globals.getLogger().error("Failed to apply actions to yandex. Did you authorize?")
            Globals.getLogger().trace(e)
            Globals.abort()
        }
    }

    // Token associated things //

    async refreshToken() {
        const refreshToken = Globals.getOauth().refreshToken
        const client = Globals.getConfig().client

        const authHeader = Buffer.from(`${client.id}:${client.secret}`).toString("base64")

        const resp = await axios({
            url: "https://oauth.yandex.ru/token",
            method: 'POST',

            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                "authorization": `Basic ${authHeader}`
            },

            data: qs.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken
            }),

            validateStatus: () => true
        })

        if (resp.data.error) {
            Globals.getLogger()
                .error(
                    chalk.bold("Error while refreshing the token:"),
                    resp.data.error,
                    resp.data.error_description
                )
            Globals.abort()
            return
        }

        Globals.updateOauth({
            accessToken: resp.data.access_token,
            refreshToken: resp.data.refresh_token,
            expiresAt: Date.now() + resp.data.expires_in * 1000
        })
    }

    async exchangeToken(code: string) {
        const client = Globals.getConfig().client
        const authHeader = Buffer.from(`${client.id}:${client.secret}`).toString("base64")

        const resp = await axios({
            url: "https://oauth.yandex.ru/token",
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                "authorization": `Basic ${authHeader}`
            },
            data: qs.stringify({
                grant_type: "authorization_code",
                code
            }),

            validateStatus: () => true

        })

        if (resp.data.error) {
            Globals.getLogger().error(chalk.bold("error while getting token :("), resp.data.error_description)
            Globals.abort()
            return
        }

        Globals.updateOauth({
            accessToken: resp.data.access_token,
            refreshToken: resp.data.refresh_token,
            expiresAt: Date.now() + resp.data.expires_in * 1000
        })
    }


}
