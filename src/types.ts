export type GetDevicesResponse = YandexResponse<{
    devices: YandexDevice[]
}>


export type YandexResponse<T> =
    {
        status: "error",
        message: string
    }
    | ({ status: "ok" } & T)

export namespace YandexCapability {
    export type Any = OnOff | Range | ColorSetting

    export type Base<T> = {
        reportable: boolean,
        retrievable: boolean,
        last_updated: number

        type: Type,
        state: any,
        parameters: any
    } & T // & { type: T, state: S, parameters: P }

    export enum Type {
        OnOff = "devices.capabilities.on_off",
        ColorSetting = "devices.capabilities.color_setting",
        Mode = "devices.capabilities.mode",
        Range = "devices.capabilities.range",
        Toggle = "devices.capabilities.toggle"
    }

    export type OnOff = Base<{
        type: Type.OnOff,
        state: {
            instance: "on",
            value: boolean
        },
        parameters: { split: boolean }
    }>

    export type Range = Base<
        { type: Type.Range } &
        (PossibleRanges.Brightness)
    >

    export type ColorSetting = Base<{ type: Type.ColorSetting } & ({
        state: {
            instance: "rgb",
            value: number
        } | {
            instance: "temperature_k",
            value: number
        } | {
            instance: "hsv",
            value: Record<"h" | "s" | "v", number>
        }

        parameters: ({
            color_model: "hsv" | "rgb"
        } | {
            temperature_k: { min: number, max: number }
        })
    })>

    export namespace PossibleRanges {
        export type Brightness = {
            parameters: {
                instance: 'brightness',
                unit: 'unit.percent',
                range: any
            }
            state: { instance: 'brightness', value: number }
        }
    }

}

export type YandexDevice = {
    id: string
    name: string
    aliases: string[]
    type: string
    external_id: string
    skill_id: string
    household_id: string
    capabilities: YandexCapability.Any[]
    properties: any[]
}
