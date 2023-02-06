import { flashMessage } from "../utils/domElements.js";
import { createOnKeydown } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";
import { toArray } from "../utils/mixed.js";
import * as doAction from "./doAction.js";

export default class ControlsKeydownManager extends EventsManager {

	constructor({
		media,
		controls,
		rates,
		maxSpeed,
		minSpeed,
		exceptionConditions=[],
	}={}) {
		super({
			target: document,
			type: "keydown",
			listeners: [],
		});
		this.media = media;
		this.controls = controls;
		this.rates = rates;
		this.maxSpeed = maxSpeed;
		this.minSpeed = minSpeed;
		this.exceptionConditions = toArray(exceptionConditions);
		this.add(this.createListeners());
	}

	/**
	 * @returns HTMLMediaElement
	 */
	get media() {
		return this._media;
	}

	/**
	 * @param {HTMLMediaElement} newMedia
	 */
	set media(newMedia) {
		this._media = newMedia;
	}

	showMediaSpeed() {
		flashMessage(this.media.playbackRate.toFixed(2));
	}

	async resumeMedia() {
		try {
			if (this.media.paused) {
				await this.media.play();
			}
		} catch (error) {
			console.error(error);
		}
	}

	async jumpToBeginListener() {
		try {
			doAction.jumpToBegin(this.media);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	jumpToEndListener() {
		doAction.jumpToEnd(this.media);
	}

	async jumpToMiddleListener({ key }) {
		try {
			doAction.jumpToMiddle(this.media, parseInt(key) / 10);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	async forwardListener() {
		try {
			doAction.forward(this.media, this.rates.time);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	async ctrlForwardListener() {
		try {
			doAction.forward(this.media, this.rates.ctrl.time);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	async backwardListener() {
		try {
			doAction.backward(this.media, this.rates.time);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	async ctrlBackwardListener() {
		try {
			doAction.backward(this.media, this.rates.ctrl.time);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	async togglePlayListener() {
		try {
			await doAction.togglePlay(this.media);
		} catch (error) {
			console.error(error);
		}
	}

	increaseSpeedListener() {
		doAction.increaseSpeed(
			this.media, this.rates.speed, this.minSpeed, this.maxSpeed
		);
		this.showMediaSpeed();
	}

	ctrlIncreaseSpeedListener() {
		doAction.increaseSpeed(
			this.media, this.rates.ctrl.speed, this.minSpeed, this.maxSpeed
		);
		this.showMediaSpeed();
	}

	decreaseSpeedListener() {
		doAction.decreaseSpeed(
			this.media, this.rates.speed, this.minSpeed, this.maxSpeed
		);
		this.showMediaSpeed();
	}

	ctrlDecreaseSpeedListener() {
		doAction.decreaseSpeed(
			this.media, this.rates.ctrl.speed, this.minSpeed, this.maxSpeed
		);
		this.showMediaSpeed();
	}

	resetSpeedListener() {
		doAction.resetSpeed(this.media);
		this.showMediaSpeed();
	}

	increaseVolumeListener() {
		doAction.increaseVolume(this.media, this.rates.volume);
	}

	ctrlIncreaseVolumeListener() {
		doAction.increaseVolume(this.media, this.rates.ctrl.volume);
	}

	decreaseVolumeListener() {
		doAction.decreaseVolume(this.media, this.rates.volume);
	}

	ctrlDecreaseVolumeListener() {
		doAction.decreaseVolume(this.media, this.rates.ctrl.volume);
	}

	toggleMuteListener() {
		doAction.toggleMute(this.media);
	}

	toString() {
		return Object
			.entries(this.controls)
			.map(([type, keys]) => `${type}: ${keys.join(", ")}`)
			.join("\n");
	}

	createListeners() {
		const thisArg = this;
		return [
			...this.exceptionConditions.map((condition) => {
				return (event) => {
					if (condition(event)) {
						event.stopImmediatePropagation();
					}
				};
			}),
			...[
				{
					keys: this.controls.begin,
					listener: this.jumpToBeginListener,
				},
				{
					keys: this.controls.end,
					listener: this.jumpToEndListener,
				},
				{
					keys: this.controls.middle,
					listener: this.jumpToMiddleListener,
				},
				{
					keys: this.controls.backward,
					listener: this.backwardListener,
				},
				{
					keys: this.controls.backward,
					ctrlKey: true,
					listener: this.ctrlBackwardListener,
				},
				{
					keys: this.controls.forward,
					listener: this.forwardListener,
				},
				{
					keys: this.controls.forward,
					ctrlKey: true,
					listener: this.ctrlForwardListener,
				},
				{
					keys: this.controls.togglePlay,
					listener: this.togglePlayListener,
				},
				{
					keys: this.controls.increaseSpeed,
					listener: this.increaseSpeedListener,
				},
				{
					keys: this.controls.increaseSpeed,
					ctrlKey: true,
					listener: this.ctrlIncreaseSpeedListener,
				},
				{
					keys: this.controls.decreaseSpeed,
					listener: this.decreaseSpeedListener,
				},
				{
					keys: this.controls.decreaseSpeed,
					ctrlKey: true,
					listener: this.ctrlDecreaseSpeedListener,
				},
				{
					keys: this.controls.resetSpeed,
					listener: this.resetSpeedListener,
				},
				{
					keys: this.controls.increaseVolume,
					listener: this.increaseVolumeListener,
				},
				{
					keys: this.controls.increaseVolume,
					ctrlKey: true,
					listener: this.ctrlIncreaseVolumeListener,
				},
				{
					keys: this.controls.decreaseVolume,
					listener: this.decreaseVolumeListener,
				},
				{
					keys: this.controls.decreaseVolume,
					ctrlKey: true,
					listener: this.ctrlDecreaseVolumeListener,
				},
				{
					keys: this.controls.toggleMute,
					listener: this.toggleMuteListener,
				},
			]
				.map(({ listener, ...rest }) => {
					return createOnKeydown({
						listener: listener.bind(thisArg),
						...rest,
					});
				}),
		];
	}

}
