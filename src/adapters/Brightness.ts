import { Adapter } from "./index.js";
import { Capability } from "../yandex/Capability.js";
import { Device } from "../yandex/Device.js";
import { Characteristic, CharacteristicProps, Formats, Perms } from "hap-nodejs";

import { YandexCapability } from "../types.js";
type RangeBrightness = YandexCapability.PossibleRanges.Brightness

export default class BrightnessAdapter extends Adapter {
    public readonly characteristic = Characteristic.Brightness

    verify(capability: Capability): boolean {
        return capability.type === YandexCapability.Type.Range
            && (capability as YandexCapability.PossibleRanges.Brightness).parameters?.instance === 'brightness';
    }

    getProps(capability: Capability): CharacteristicProps {
        return {
            format: Formats.INT,
            perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
            minValue: (capability as RangeBrightness).parameters.range.min,
            maxValue: (capability as RangeBrightness).parameters.range.max,
            minStep: (capability as RangeBrightness).parameters.range.precision ?? 1
        }
    }

    get(capability: Capability, device: Device): number {
        const state = capability.state as RangeBrightness['state']

        return state.value
    }

    set(value: boolean, capability: Capability, device: Device): void {
        capability.updateState({ value })
    }
}
