import path from 'path';
import { fileURLToPath } from 'url';

import { glob } from "glob";
import { Capability } from "../yandex/Capability.js";
import { Device } from "../yandex/Device.js";
import { Characteristic, CharacteristicProps, CharacteristicValue, WithUUID } from "hap-nodejs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getAdapters(): Promise<(typeof Adapter)[]> {
    const filenames = (await glob(path.join(__dirname, "*.js"))).filter((fn) => path.basename(fn) !== "index.js")

    return Promise.all(filenames.map((filename) => (
        import(filename).then((res) => res.default)
    )))
}

export abstract class Adapter {
    /**
     * HomeKit's characteristic to use
     */
    public readonly characteristic: WithUUID<new () => Characteristic>

    /**
     * Function to implement for HomeKit to pass props (f.e. min, max values)
     */
    public abstract getProps(capability: Capability): CharacteristicProps

    /**
     * Function to verify "Is that right adapter?"
     *
     * @param capability {Capability} - Capability for example
     * @returns Is that right adapter
     */
    abstract verify(capability: Capability): boolean

    /**
     * Method, which will be executed to transform data from YandexAPI standards to Apple's standards
     *
     * @param capability {Capability} - Yandex's capability (contains state and params)
     * @param device {Device} - Device, which contains Yandex's capabilities and Homekit Accessory
     *
     * @returns {any} Transformed state for Homekit
     */
    abstract get(capability: Capability, device: Device): any

    /**
     * Method, which will be executed to transform data from Apple's standards to YandexAPI standards
     *
     * @note
     *  **Function nothing returns**. Apply all transforms to `capability` parameter!
     *
     * @param value {CharacteristicValue} - Characteristic value from homekit
     * @param capability {Capability} - Yandex's capability (contains state and params)
     * @param device {Device} - Device, which contains Yandex's capabilities and Homekit Accessory
     */
    abstract set(value: CharacteristicValue, capability: Capability, device: Device): void
}
