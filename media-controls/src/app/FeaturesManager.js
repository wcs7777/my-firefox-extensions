import ControlsKeydownManager from "../media/ControlsKeydownManager.js";
import getCurrentMedia from "../media/getCurrentMedia.js";
import getMedias from "../media/getMedias.js";
import MediaTimeInput from "../media/MediaTimeInput.js";
import { formatSeconds } from "../utils/alphanumeric.js";
import { flashMessage } from "../utils/domElements.js";
import { createOnKeydown, onAppend, onRemoved } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";
import { sleep } from "../utils/mixed.js";

export default class FeaturesManager extends EventsManager {

	/**
	 * @param {ControlsKeydownManager} controlsKeydownManager
	 */
	constructor(shortcuts, controlsKeydownManager) {
		super({
			target: document,
			type: "keydown",
			listeners: [],
		});
		this.shortcuts = shortcuts;
		this.controlsKeydownManager = controlsKeydownManager;
		this.savePoint = 0;
		this.mediaTimeInput = new MediaTimeInput({
			shortcuts: { synchronizeValue: this.shortcuts.synchronizeValue },
			separator: ":",
			cssText: `
			position: fixed;
			width: 100px;
			height: 40px;
			top: 50%;
			left: 50%;
			margin-top: -20px;
			margin-left: -50px;
			padding: 10px;
			color: rgb(255, 255, 255);
			background-color: rgba(0, 0, 0, .8);
			font: 25px/1.2 Arial, sens-serif;
			z-index: 99999;
			`,
		});
		this.onMediaAppend = onAppend({
			selectors: "video, audio",
			options: { childList: true, subtree: true },
			listener: this.listenMedias.bind(this),
		});
		this.mediaTimeInput.addEventListener(
			"removed", this.mediaTimeInputRemovedListener.bind(this)
		);
		this.add(this.createListeners());
	}

	/**
	 * @returns {HTMLMediaElement}
	*/
	get currentMedia() {
		return this._currentMedia;
	}

	/**
	 * @param {HTMLMediaElement} media
	*/
	set currentMedia(media) {
		this._currentMedia = media;
		this.controlsKeydownManager.media = media;
	}

	/**
	 * @param {boolean} newState
	 */
	set state(newState) {
		const medias = getMedias();
		if (typeof newState === "boolean" && newState !== this.state) {
			if (newState && medias.length > 0) {
				this.onMediaAppend.observe();
				this.currentMedia = getCurrentMedia(medias);
				this.listenMedias(medias);
			} else {
				this.onMediaAppend.disconnect();
			}
			this.controlsKeydownManager.state = newState;
			flashMessage(`Media Controls Features ${newState ? "On" : "Off"}`);
			super.state = newState;
		}
	}

	jumpToTimeListener() {
		this.off();
		document.body.appendChild(
			this.mediaTimeInput.prepareAppend(this.currentMedia),
		);
		this.mediaTimeInput.focus();
	}

	showControlsListener() {
		flashMessage(this.controlsKeydownManager.toString(), 5000, 16);
	}

	createSavePointListener() {
		this.savePoint = this.currentMedia.currentTime;
		if (this.savePoint != null) {
			flashMessage(`Save Point Created: ${formatSeconds(this.savePoint)}`);
		}
	}

	restoreSavePointListener() {
		if (this.savePoint != null) {
			this.currentMedia.currentTime = this.savePoint;
			flashMessage(`Save Point Restored: ${formatSeconds(this.savePoint)}`);
		}
	}

	loopListener() {
		const flag = !this.currentMedia.loop;
		this.currentMedia.loop = flag;
		flashMessage(`Loop ${flag ? "On": "Off"}`);
	}

	async mediaTimeInputRemovedListener() {
		try {
			this.on();
			await sleep(100);
			await this.currentMedia.play();
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * @param {HTMLMediaElement[]} medias
	 */
	listenMedias(medias) {
		const thisArg = this;
		const setCurrentMedia = (event) => {
			thisArg.currentMedia = event.currentTarget;
		};
		const updateOnRemoved = (media) => {
			if (thisArg.currentMedia === media) {
				thisArg.off();
				thisArg.currentMedia = getCurrentMedia();
				if (thisArg.currentMedia != null) {
					thisArg.on();
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

	createListeners() {
		const thisArg = this;
		return [
			{
				keys: this.shortcuts.jumpToTime,
				listener: this.jumpToTimeListener,
			},
			{
				keys: this.shortcuts.showControls,
				listener: this.showControlsListener,
			},
			{
				keys: this.shortcuts.createSavePoint,
				listener: this.createSavePointListener,
			},
			{
				keys: this.shortcuts.restoreSavePoint,
				listener: this.restoreSavePointListener,
			},
			{
				keys: this.shortcuts.loop,
				listener: this.loopListener,
			},
		]
			.map(({ listener, ...rest }) => {
				return createOnKeydown({
					listener: listener.bind(thisArg),
					caseSensitive: false,
					ctrlKey: true,
					...rest,
				});
			});
	}

}
