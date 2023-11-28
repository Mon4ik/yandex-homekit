import {Adapter} from "./index.js";
import {Capability} from "../Capability.js";
import {Device} from "../Device.js";
import {CapabilityEnum, YandexOnOffCapability, YandexRangeBrightness} from "../types.js";
import {Characteristic, CharacteristicProps, Formats, Perms} from "hap-nodejs";

export default class BrightnessAdapter extends Adapter {
	public readonly characteristic = Characteristic.Brightness

	verify(capability: Capability): boolean {
		return capability.type === CapabilityEnum.Range && (capability as YandexRangeBrightness).parameters?.instance === 'brightness';
	}

	getProps(capability: Capability): CharacteristicProps {
		return {
			format: Formats.INT,
			perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
			minValue: (capability as YandexRangeBrightness).parameters.range.min,
			maxValue: (capability as YandexRangeBrightness).parameters.range.max,
			minStep: (capability as YandexRangeBrightness).parameters.range.precision ?? 1
		}
	}

	get(capability: Capability, device: Device): number {
		const state = capability.state as YandexRangeBrightness['state']

		console.log(capability.parameters)
		return state.value
	}

	set(value: boolean, capability: Capability, device: Device): void {
		capability.updateState({ value })
	}
}