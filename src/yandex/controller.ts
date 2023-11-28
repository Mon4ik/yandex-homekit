import {OAuthServer} from "../oauth/index.js";
import ip from "ip";
import chalk from "chalk";

import {YandexAPI} from "./api.js";
import {Device} from "../Device.js";
import {Globals} from "../Globals.js";
import * as hap from "hap-nodejs";
import {YandexDevice} from "../types.js";

/*
 * Controller for:
 *  - Syncing devices
 *  - Managing token
 */
export class YandexController {
	private readonly bridge: hap.Bridge

	private oauthServer = new OAuthServer((code) => this.yandexAPI.exchangeToken(code))
	private yandexAPI: YandexAPI

	private refreshAt = Number.POSITIVE_INFINITY

	private mountedDevices = new Array<Device>()
	private updatePool = new Set<any>()

	constructor(bridge: hap.Bridge) {
		this.bridge = bridge
		this.yandexAPI = new YandexAPI();

		(async () => {
			await Globals.loadAdapters()

			await this.tokenVerify()
			await this.initAccessories()
		})()
	}

	public async initAccessories() {
		const yandexDevices = await this.yandexAPI.getDevices()

		for (const yandexDevice of yandexDevices) {
			this.addDevice(yandexDevice)
		}
	}

	/* Ticks */
	public async tick() {
		// refresh token
		if (Date.now() >= this.refreshAt) {
			await this.refreshToken()
		}

		// device sync
		const yandexDevices = await this.yandexAPI.getDevices()

		for (const yandexDevice of yandexDevices) {
			let device = this.mountedDevices.find((dev) => dev.id === yandexDevice.id)

			// is that new device O_o
			if (!device) device = this.addDevice(yandexDevice)

			for (const capability of device.capabilities) {
				const yandexCapability = yandexDevice.capabilities.find((cap) => cap.type === capability.type)
				if (!yandexCapability) continue

				capability.syncWithYandex(yandexCapability)
			}
		}

		// sendin' to yandex
		const devicesActions = this.mountedDevices.map((dev) => ({
			id: dev.id,
			actions: dev.jsonActions()
		})).filter((act) => act.actions.length !== 0)

		if (devicesActions.length === 0) return

		await this.yandexAPI.applyActions({devices: devicesActions})
	}

	/// e ///
	addDevice(yandexDevice: YandexDevice) {
		const device = new Device(yandexDevice)
		this.bridge.addBridgedAccessory(device.homekitAccessory)

		this.mountedDevices.push(device)
		return device
	}


	/// Token based things ///

	private async refreshToken() {
		await this.yandexAPI.refreshToken()

		// update interval
		this.refreshAt = Globals.getOauth().expiresAt - 15_000 // expiresAt - 15 secs, becoz network speed
	}

	/* Verify existing token, and(or) create new */
	private async tokenVerify() {
		const oauth = Globals.getOauth()

		if (!oauth.accessToken || Date.now() >= oauth.expiresAt) {
			// token expired :(
			console.error(chalk.red.bold` ================== TOKEN EXPIRED! ==================`)
			console.error(chalk.red` (*) Please, go to local server at http://${ip.address('private')}:13370/`)
			console.error(chalk.red`     and authorize at Yandex OAuth to obtain token`)
			console.error(chalk.red` (!) Also verify, that you placed client.id and client.secret in`)
			console.error(chalk.red`     ${Globals.configPath()} file`)
			console.error(chalk.red.bold` ====================================================`)

			this.oauthServer.start()
			return
		}

		await this.refreshToken()
	}
}