import hap from "hap-nodejs";

const Service = hap.Service

export const SERVICE_MAP = new Map<string, typeof Service>([
	["devices.types.socket", Service.Outlet],
	["devices.types.light", Service.Lightbulb]
])