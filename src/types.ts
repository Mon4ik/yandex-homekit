export type GetDevicesResponse = YandexResponse<{
	devices: YandexDevice[]
}>


export type YandexResponse<T> =
	{
		status: "error",
		message: string
	}
	| ({ status: "ok" } & T)

export type YandexOnlyRequiredCapability<T, D> = {
	reportable: boolean,
	retrievable: boolean,
	last_updated: number,
	type: T
} & D

export type YandexBaseCapability<T, S, P> = {
	reportable: boolean,
	retrievable: boolean,
	type: T,
	state: S,
	parameters: P,
	last_updated: number
}

export type YandexOnOffCapability = YandexBaseCapability<
	CapabilityEnum.OnOff,
	{
		instance: "on",
		value: boolean
	},
	{
		split: boolean
	}
>

export type YandexColorSettingCapability = YandexBaseCapability<
	CapabilityEnum.ColorSetting,
	// state
	{
		instance: "hsv",
		value: { h: number, s: number, v: number }
	} &
	{
		instance: "rgb",
		value: number
	} &
	{
		instance: "temperature_k",
		value: number
	},
	// parameters
	{ color_model: "hsv" | "rgb" } &
	{ temperature_k: { min: number, max: number } }
>

export type YandexRangeBrightness = {
	parameters: {
		instance: 'brightness',
		unit: 'unit.percent',
		range: any
	}
	state: { instance: 'brightness', value: number }
}

export type YandexRangeCapability = YandexOnlyRequiredCapability<
	CapabilityEnum.Range,
	YandexRangeBrightness
>

export type YandexCapability = YandexOnOffCapability | YandexColorSettingCapability | YandexRangeCapability

export enum CapabilityEnum {
	OnOff = "devices.capabilities.on_off",
	ColorSetting = "devices.capabilities.color_setting",
	Mode = "devices.capabilities.mode",
	Range = "devices.capabilities.range",
	Toggle = "devices.capabilities.toggle"
}


export type YandexDevice = {
	id: string
	name: string
	aliases: string[]
	type: string
	external_id: string
	skill_id: string
	household_id: string
	capabilities: YandexCapability[]
	properties: any[]
}