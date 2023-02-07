import ControlsManager from "../media/ControlsManager.js";
import getCurrentMedia from "../media/getCurrentMedia.js";
import getMedias from "../media/getMedias.js";
import { createOnKeydown, onAppend, onRemoved } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";

export default class MainManager extends EventsManager {

	/**
	 * @param {string} shortcut
	 * @param {ControlsManager} controlsManager
	 */
	constructor(shortcut, controlsManager) {
		super({
			target: document,
			type: "keydown",
			on: true,
			listeners: [],
		});
		this.controlsManager = controlsManager;
		this.onMediaAppend = onAppend({
			selectors: "video, audio",
			options: { childList: true, subtree: true },
			listener: this.listenMedias.bind(this),
		});
		this.add(
			createOnKeydown({
				keys: shortcut,
				ctrlKey: true,
				caseSensitive: false,
				listener: this.toggleControlsManager.bind(this),
			}),
		);
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
			if (!newState && this.controlsManager.state) {
				this.toggleControlsManager()
			}
			super.state = newState;
		}
	}

	toggleControlsManager() {
		if (this.controlsManager.state) {
			this.onMediaAppend.disconnect();
			this.controlsManager.off();
		} else {
			const medias = getMedias();
			if (medias.length > 0) {
				this.onMediaAppend.observe();
				this.controlsManager.media = getCurrentMedia(medias);
				this.listenMedias(medias);
				this.controlsManager.on();
			}
		}
	}

	/**
	 * @param {HTMLMediaElement[]} medias
	 */
	listenMedias(medias) {
		const manager = this.controlsManager;
		const setCurrentMedia = (event) => manager.media = event.currentTarget;
		const updateOnRemoved = (media) => {
			if (manager.state && manager.media === media) {
				manager.media = getCurrentMedia();
				if (manager.media == null) {
					manager.off();
				}
			}
		};
		for (const media of medias) {
			media.removeEventListener("play", setCurrentMedia);
			media.addEventListener("play", setCurrentMedia);
			if (media.__onRemovedMutationObserver == null) {
				media.__onRemovedMutationObserver = onRemoved({
					element: media,
					options: { childList: true, subtree: true },
					listener: updateOnRemoved,
				});
			}
		}
	}

}