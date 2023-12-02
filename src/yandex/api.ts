import axios from "axios";
import qs from "qs"
import chalk from "chalk";

import {Globals} from "../Globals.js";
import {Device} from "../Device.js";
import ip from "ip";

import type {GetDevicesResponse, YandexResponse} from "../types.js";

export class YandexAPI {
	public get token() {
		return Globals.getOauth().accessToken
	}

	// IOT associated things
	async getDevices() {
		const resp = await axios<GetDevicesResponse>({
			url: "https://api.iot.yandex.net/v1.0/user/info",
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.token}`
			},
			validateStatus: () => true
		})

		if (resp.data.status === "error") {
			Globals.getLogger().error(chalk.bold`Error while getting devices`)
			Globals.getLogger().error(` Please verify your token!`)

			process.exit(1)
		}

		return resp.data.devices
	}

	async applyActions(devices: any): Promise<true> {
		const resp = await axios<GetDevicesResponse>({
			url: "https://api.iot.yandex.net/v1.0/devices/actions",
			method: "POST",
			headers: {
				"Authorization": `Bearer ${this.token}`
			},
			data: devices,
			validateStatus: () => true
		})

		if (resp.data.status === "error") {
			Globals.getLogger().error(`Error while updating devices.`, resp.data.message)
			Globals.getLogger().error(`Please verify your token!`)

			process.exit(1)
		}

		return true
	}

	// Token associated things
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
			Globals.getLogger().error(chalk.bold("error while refreshing token :("), resp.data.error, resp.data.error_description)

			process.exit(1)
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

			process.exit(1)
		}

		Globals.updateOauth({
			accessToken: resp.data.access_token,
			refreshToken: resp.data.refresh_token,
			expiresAt: Date.now() + resp.data.expires_in * 1000
		})
	}


}