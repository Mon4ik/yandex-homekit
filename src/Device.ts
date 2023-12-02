import {Accessory, Categories, Characteristic, Service} from "hap-nodejs";
import {SERVICE_MAP} from "./utils.js";
import {Capability} from "./Capability.js";

import type {YandexDevice} from "./types.js";
import {Globals} from "./Globals.js";
import chalk from "chalk";
import * as hap from "hap-nodejs";
import _ from "lodash";

export class Device {
	private readonly _accessory: Accessory
	private _service: Service

	private readonly _initialDevice: YandexDevice
	private readonly _capabilities: Capability[]

	private pendingActions = new Map<string, Record<string, any>>()

	constructor(initialDevice: YandexDevice) {
		this._initialDevice = initialDevice
		this._accessory = new Accessory(initialDevice.name, hap.uuid.generate(`yhk.accessory.${initialDevice.id}`))
		this._capabilities = initialDevice.capabilities.map((cap) => new Capability(cap, this.pendingActions))

		this.initAccessory()
	}

	get homekitAccessory() {
		return this._accessory
	}

	get homekitService() {
		return this._service
	}

	// Basic YandexAPI fields
	get id() {
		return this._initialDevice.id
	}

	get type() {
		return this._initialDevice.type
	}

	get name() {
		return this._initialDevice.name
	}

	get initialDevice() {
		return this._initialDevice
	}

	get capabilities() {
		return this._capabilities
	}


	jsonActions() {
		const pendingActions = _.clone(this.pendingActions)
		this.pendingActions.clear()


		return Array.from(pendingActions)
			.map(([type, state]) => ({
				type, state
			}))
	}

	private async initCapabilities() {
		const adapters = Globals.adapters

		for (const capability of this._capabilities) {
			Globals.getLogger().trace(capability)
			if (capability.state === null) {
				Globals.getLogger().warn(`The capability "${capability.type}" is null. Please, check on yandex, that's you setup device "${this._initialDevice.name}".`)
				continue
			}

			const adapter = adapters.find((adp) => adp.verify(capability))
			if (!adapter) {
				Globals.getLogger().warn(`The capability "${capability.type}" isn't supporting (no such adapters for it). So you cannot control this capability through HomeKit. But it CAN be implemented in new yandex-homekit version, so check it out.`)
				continue
			}

			const characteristic = this._service.getCharacteristic(adapter.characteristic)

			characteristic.setProps(adapter.getProps(capability))
			characteristic.on("get", (cb) => {
				try {
					const result = adapter.get(capability, this)
					Globals.getLogger().trace(`[GET] ${characteristic.displayName} < ${result}`)
					cb(undefined, result)
				} catch (e) {
					cb(e)
				}
			})

			characteristic.on("set", (value, cb) => {
				try {
					Globals.getLogger().trace(`[SET] ${characteristic.displayName} < ${value}`)

					adapter.set(value, capability, this)
					cb(null)
				} catch (e) {
					Globals.getLogger().error(`[SET] ${characteristic.displayName} < (ERR!)`, e)
					cb(e)
				}
			})
		}
	}

	private async initAccessory() {
		// information service
		const accessoryInformation = this._accessory.getService(Service.AccessoryInformation)

		const serialNumber =  accessoryInformation.getCharacteristic(Characteristic.SerialNumber)
		serialNumber.setValue(this._initialDevice.skill_id)

		// main service
		const AccessoryService = (SERVICE_MAP.get(this._initialDevice.type) ?? Service.Switch) as typeof Service

		this._service = new AccessoryService(this._initialDevice.name, this._initialDevice.name + this._initialDevice.id)

		await this.initCapabilities()

		this._accessory.addService(this._service)
		// service.getCharacteristic()
	}
}