import hap from "hap-nodejs";
import axios from "axios";
import { Globals } from "./Globals.js";
import semver from "semver/preload.js";
import boxen from "boxen";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const Service = hap.Service

export const SERVICE_MAP = new Map<string, typeof Service>([
    ["devices.types.socket", Service.Outlet],
    ["devices.types.light", Service.Lightbulb]
])

export async function checkForUpdates() {
    const resp = await axios("https://api.github.com/repos/Mon4ik/yandex-homekit/releases", { validateStatus: () => true })
    if (resp.data.message || !Array.isArray(resp.data) || resp.status >= 400) {
        Globals.getLogger().error("Got error while checking for updates.")
        return
    }

    const latestRelease = resp.data
        .filter((release) => !release.prerelease)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    // debug example:
    // latestRelease.tag_name = "v6.6.6"

    // latest > current
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json")).toString("utf-8"))

    if (semver.gt(semver.coerce(latestRelease.tag_name), semver.coerce(packageJson.version))) {
        Globals.getLogger().info(`Found new update (${latestRelease.tag_name})! Additional information in stdout`)

        console.info(boxen([
            chalk.yellowBright`New update available (${latestRelease.tag_name})!`,
            "Please, update the package through:",
            chalk.green` $ ` + chalk.bold`npm i -g yandex-homekit@latest`
        ].join("\n"), { padding: 0.5, borderStyle: "round", dimBorder: true, textAlignment: "center" }));
        console.info(chalk.grey`Additional information: ` + chalk.grey.bold.underline(latestRelease.html_url))
    }
}
