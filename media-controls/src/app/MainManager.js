import { createOnKeydown } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";
import FeaturesKeydownManager from "./FeaturesManager.js";

export default class MainManager extends EventsManager {

	/**
	 * @param {string} shortcut
	 * @param {FeaturesKeydownManager} featuresManager
	 */
	constructor(shortcut, featuresManager) {
		super({
			target: document,
			type: "keydown",
			on: true,
			listeners: createOnKeydown({
				keys: shortcut,
				ctrlKey: true,
				caseSensitive: false,
				listener: () => featuresManager.toggle(),
			}),
		});
		this.featuresManager = featuresManager;
	}

	/**
	 * @returns {boolean}
	 */
	get state() {
		return this._state;
	}

	/**
	 * @param {boolean} newState
	 */
	set state(newState) {
		if (typeof newState === "boolean" && newState !== this.state) {
			if (!newState) {
				this.featuresManager.off();
			}
			super.state = newState;
		}
	}

}