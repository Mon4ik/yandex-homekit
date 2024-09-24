import * as hap from "hap-nodejs";
import macaddress from "macaddress";

import { HAPStorage } from "hap-nodejs";
import { Globals } from "./Globals.js";
import { YandexController } from "./yandex/controller.js";

const Characteristic = hap.Characteristic;
const Service = hap.Service;

export class YandexBridge {
    private readonly bridge: hap.Bridge
    private readonly yandexController: YandexController

    constructor() {
        HAPStorage.setCustomStoragePath(Globals.persistPath())

        this.bridge = new hap.Bridge('Yandex Bridge', hap.uuid.generate("yhk.bridge"))
        this.yandexController = new YandexController(this.bridge)

        setInterval(() => {
            this.tick()
        }, 2000)
    }

    public async publish(): Promise<[hap.PublishInfo, string]> {
        const mac = (await macaddress.one()).toUpperCase()

        const info = {
            username: mac,
            pincode: "133-70-513",
            port: 47129,
            category: hap.Categories.BRIDGE,
        } as hap.PublishInfo


        this.bridge.on("paired", () => {
            Globals.getLogger().info(`🔗 Bridge successfully paired!`)
        })

        this.bridgeSetup(mac)

        await this.bridge.publish(info)
        return [info, this.bridge.setupURI()]
    }

    private bridgeSetup(mac: string) {
        const accessoryInformation = this.bridge.getService(Service.AccessoryInformation)

        const manufacturer = accessoryInformation.getCharacteristic(Characteristic.Manufacturer)
        const model = accessoryInformation.getCharacteristic(Characteristic.Model)
        const serialNumber = accessoryInformation.getCharacteristic(Characteristic.SerialNumber)
        const firmwareRevision = accessoryInformation.getCharacteristic(Characteristic.FirmwareRevision)

        model.setValue("Yandex HomeKit Bridge")
        manufacturer.setValue("@idkncc")
        serialNumber.setValue(mac)
        firmwareRevision.setValue(process.env.npm_package_version ?? '0.0.0')
    }

    /*
     * Ticks
     *  1. Runs tick() in YandexAPI class
     */
    private tick() {
        this.yandexController.tick()
    }

}
