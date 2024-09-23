import { Adapter } from "./index.js";
import { Capability } from "../yandex/Capability.js";
import { Device } from "../yandex/Device.js";
import { Characteristic, CharacteristicProps, Formats, Perms } from "hap-nodejs";

import { YandexCapability } from "../types.js";

export default class ColorTemperatureAdapter extends Adapter {
    public readonly characteristic = Characteristic.ColorTemperature

    private convertRange(value: number, r1: number[], r2: number[]) {
        return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }

    verify(capability: Capability): boolean {
        return capability.type === YandexCapability.Type.ColorSetting
            && !!(capability.parameters?.temperature_k)
            && !(capability.parameters.color_model);
    }

    getProps(capability: any): CharacteristicProps {
        return {
            format: Formats.INT,
            perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
            // minValue: capability.parameters.temperature_k.min,
            // maxValue: capability.parameters.temperature_k.max,
        }
    }

    get(capability: Capability, device: Device): number {
        const state = capability.state as { value: number }
        const parameters = capability.parameters as { temperature_k: { min: number, max: number } }
        const homekitProps = device.homekitService.getCharacteristic(this.characteristic).props

        return this.convertRange(state.value, [parameters.temperature_k.max, parameters.temperature_k.min], [homekitProps.minValue, homekitProps.maxValue])
    }

    set(value: number, capability: Capability, device: Device): void {
        const parameters = capability.parameters as { temperature_k: { min: number, max: number } }
        const homekitProps = device.homekitService.getCharacteristic(this.characteristic).props

        const newValue = Math.round(this.convertRange(value, [homekitProps.minValue, homekitProps.maxValue], [parameters.temperature_k.max, parameters.temperature_k.min]))

        capability.updateState({ instance: "temperature_k", value: newValue })
    }
}
