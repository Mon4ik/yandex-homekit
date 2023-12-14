#!/usr/bin/env node
import {YandexBridge} from "./YandexBridge.js";
import {program} from '@commander-js/extra-typings';
import qrcode from "qrcode-terminal"
import chalk from "chalk";
import {Globals} from "./Globals.js";
import * as fs from "fs";

import Enquirer from "enquirer"
import {OAuthServer} from "./oauth/index.js";
import ip from "ip";

import open from "open";
import {checkForUpdates} from "./utils.js";

program
	.name('yandex-homekit')
	.description("Bridge to add Yandex Devices to HomeKit")
	.version("1.0.0")

program.command('cleanup')
	.description('Clean persist, or clean all app settings (by default cleans only cache)')
	.argument("<entry>", "What to delete (persist, logs, all)")
	.option("--all", "DELETES EVERYTHING (configs, cache)! Be careful!")
	.option("-f, --force", "Delete without questions")
	.action(async (entry: 'persist' | 'logs' | 'all', options) => {
		async function promptDelete(path: string) {
			if (!options.force) {
				//@ts-ignore
				const prompt = new Enquirer.Confirm({
					name: 'question',
					message: chalk.red`Delete ${chalk.bold(path)}?`
				});

				const answer = await prompt.run()
				if (!answer) {
					console.log(chalk.red("aborting..."))
					process.exit(0)
				}
			}
			fs.rmSync(path, {recursive: true, force: true})
		}

		if (entry === "persist") {
			await promptDelete(Globals.persistPath())
		} else if (entry === "logs") {
			await promptDelete(Globals.logsPath())
		} else if (entry === "all") {
			await promptDelete(Globals.storagePath())
		} else {
			console.error(chalk.red(`Entry "${entry}" isn't valid.`))
			process.exit(1)
		}

	});

program.command('oauth')
	.description("Starts OAuth server for initial authorization")
	.option("--port <port>", "Change port to start server at", "13370")
	.option("-o", "Opens server in browser")
	.action(async (options) => {
		const server = new OAuthServer()

		server.start(parseInt(options.port as string))
		console.log(chalk.green(`Server started!`))
		console.log(chalk.yellow(' > ' + chalk.bold.underline(`${ip.address("private")}:${options.port}`)))

		if (options.o) {
			await open(`http://${ip.address("private")}:${options.port}`);
		}

		await server.wait()
		console.log("")
		console.log(chalk.green.bold`=== Token stored! ===`)
		console.log(chalk.green`Now you can run ${chalk.underline("yandex-homekit")} normally`)
		process.exit(0)
	})

// TODO: dumps for issues, etc
// program.command("capability-dump").description("Dumps all devices and capabilities for debuging, adding new features")

program.command('start')
	.description('Starts bridge')
	.option("-q", "Start quietly (no QRCodes, codes)")
	.option("-U, --noUpdates", "Don't check updates")
	.option("--debug", "Enables debug mode")
	.action(async (options) => {
		Globals.setDebug(options.debug ?? false)
		if (!options.noUpdates) await checkForUpdates()

		const bridge = new YandexBridge()

		bridge.publish()
			.then(([info, uri]) => {
				if (options.q) return

				Globals.getLogger().info(`🚀 Bridge started at port :${info.port}`)

				qrcode.generate(
					uri,
					{small: true},
					(qrcode) => {
						console.log(qrcode)
						console.log(`Or use this code: ${chalk.underline.bold(info.pincode)}`)
					}
				)
			})

		// console.log("end?")
	});

program.parse(process.argv);