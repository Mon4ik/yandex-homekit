import _ from "lodash"

import type { YandexCapability } from "../types.js";

/**
 * Yandex Capability, property of a `Device`, that describes its capabilities.
 *
 * @see https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/capability-types
 */
export class Capability {
    private _capability: YandexCapability.Any
    private _pendingActions: Map<string, Record<string, any>>

    constructor(initialCapability: YandexCapability.Any, pendingActions: Map<string, Record<string, any>>) {
        this._capability = initialCapability
        this._pendingActions = pendingActions
    }

    get type() {
        return this._capability.type
    }

    get state() {
        return this._capability.state
    }

    updateState(newState: any) {
        this._capability.state = Object.assign(this._capability.state, newState)
        this._capability.last_updated = Date.now() / 1000
    }

    get parameters() {
        return this._capability.parameters
    }

    get last_updated() {
        return this._capability.last_updated
    }


    /**
     * Checking for differences and applies changes on local or yandex capability
     *
     * @internal
     */
    syncWithYandex(yandexCapability: YandexCapability.Any) {
        // --- We have 3 ways in syncing ---

        // 1. The state and parameters are equal
        if (JSON.stringify([yandexCapability.state, yandexCapability.parameters]) ===
            JSON.stringify([this._capability.state, this._capability.parameters])) {
            // then we just return for this all
            return
        }

        // 2. Updated timestamp on yandex is bigger, than local timestamp
        if (yandexCapability.last_updated >= this.last_updated) {
            this._capability = yandexCapability // sync Yandex's
            return;
        }

        // 3. Updated timestamp on Yandex is less, than local
        //       --------|--------|---->
        //       Yandex -^  local-^    ^- now
        if (yandexCapability.last_updated < this.last_updated) {
            // Then we send to Yandex
            this._pendingActions.set(this.type, _.clone(this._capability.state))
        }
    }
}
