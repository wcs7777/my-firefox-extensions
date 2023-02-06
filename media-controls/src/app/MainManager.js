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

	off() {
		if (this.state) {
			super.off();
			this.featuresManager.off();
		}
	}

}