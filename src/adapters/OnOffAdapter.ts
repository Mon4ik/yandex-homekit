import { Adapter } from "./index.js";
import { Capability } from "../yandex/Capability.js";
import { Device } from "../yandex/Device.js";
import { YandexCapability } from "../types.js";
import { Characteristic, CharacteristicProps, Formats, Perms } from "hap-nodejs";

export default class OnOffAdapter extends Adapter {
    public readonly characteristic = Characteristic.On

    getProps(capability: Capability): CharacteristicProps {
        return {
            format: Formats.BOOL,
            perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
        }
    }

    verify(capability: Capability): boolean {
        return capability.type === "devices.capabilities.on_off";
    }

    get(capability: Capability, device: Device): boolean {
        const state = capability.state as YandexCapability.OnOff['state']
        return state.value
    }

    set(value: boolean, capability: Capability, device: Device): void {
        capability.updateState({ value })
    }
}
