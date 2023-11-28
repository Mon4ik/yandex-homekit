import {YandexBridge} from "./YandexBridge.js";
import {program} from "commander";

import qrcode from "qrcode-terminal"
import chalk from "chalk";


program
	.name('yandex-homekit')
	.description("Bridge to add Yandex Devices to HomeKit")
	.version("1.0.0")

program.command('cleanup')
	.description('Clean persist, or clean all app settings (by default cleans only cache)')
	.option("--all", "DELETES EVERYTHING (configs, cache)! Be careful!")
	.action((options) => {
		console.log("TODO")
		console.log(options)
	});

program.command('start')
	.description('Starts bridge')
	.option("-q", "Start quietly (no qrcodes, codes)")
	.option("-Q, --noQRCode", "Not displays pairing QRCode")
	.option("--debug", "Enables debug mode")
	.action((options) => {
		// console.log(options)

		const bridge = new YandexBridge()

		bridge.publish().then(([info, uri]) => {
			console.log(`🚀 Bridge started at port :${info.port}`)

			qrcode.generate(
				uri,
				{small: true},
				(qrcode) => {
					console.log(qrcode)
					console.log(`Or use this code: ${chalk.underline.bold(info.pincode)}`)
				}
			)
		})
		console.log(options)
	});

program.parse(process.argv);