import { formatSeconds } from "../utils/alphanumeric.js";
import { currentDomain, flashMessage } from "../utils/domElements.js";
import { createOnKeydown } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";
import { sleep, toArray } from "../utils/mixed.js";
import { domainsTable } from "../utils/tables.js";
import * as doAction from "./doAction.js";

export default class ControlsManager extends EventsManager {

	constructor({
		media,
		controls,
		rates,
		maxSpeed,
		minSpeed,
		exceptionConditions=[],
		mediaTimeInput,
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
		this.mediaTimeInput = mediaTimeInput;
		this.add(this.createListeners());
		this.savePoint = 0;
	}

	on() {
		super.on();
		flashMessage("Media Controls On");
	}

	off() {
		super.off();
		flashMessage("Media Controls Off");
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

	saveCurrentPoint() {
		this.savePoint = this.media.currentTime;
	}

	async jumpToBeginListener() {
		try {
			this.saveCurrentPoint();
			doAction.jumpToBegin(this.media);
			await this.resumeMedia();
		} catch (error) {
			console.error(error);
		}
	}

	jumpToEndListener() {
		this.saveCurrentPoint();
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

	async toggleFullscreenListener() {
		try {
			if (document.fullscreenElement == null) {
				await this.media.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (error) {
			console.error(error);
		}
	}

	showCurrentTimeListener() {
		const current = formatSeconds(this.media.currentTime);
		const total = formatSeconds(this.media.duration);
		const percentage = Math.floor(
			this.media.currentTime / this.media.duration * 100
		);
		flashMessage(`${current} / ${total} | ${percentage}%`, 3000);
	}

	showControlsListener() {
		flashMessage(this.toString(), 5000, 16);
	}

	createRestorePointListener() {
		this.saveCurrentPoint();
		flashMessage(`Save Point Created: ${formatSeconds(this.savePoint)}`);
	}

	restoreSavePointListener() {
		this.media.currentTime = this.savePoint;
		flashMessage(`Save Point Restored: ${formatSeconds(this.savePoint)}`);
	}

	toggleLoopListener() {
		const flag = !this.media.loop;
		this.media.loop = flag;
		flashMessage(`Loop ${flag ? "On": "Off"}`);
	}

	jumpToTimeListener() {
		document.body.appendChild(this.mediaTimeInput.prepareAppend(this.media));
		this.mediaTimeInput.focus();
	}

	async toggleAutoActivationDomainListener() {
		try {
			const domain = currentDomain();
			const toggle = !await this.autoActivate(domain);
			if (toggle) {
				await domainsTable.set(domain, true);
			} else {
				await domainsTable.remove(domain);
			}
			flashMessage(`Auto activation: ${toggle ? "On" : "Off"}`);
		} catch (error) {
			console.error(error);
		}
	}

	autoActivate(domain) {
		return domainsTable.get(domain);
	}

	toString() {
		return Object
			.entries(this.controls)
			.map(([type, keys]) => {
				return (
					Array.isArray(keys) ?
					`${type}: ${keys.join(", ")}` :
					Object
						.entries(keys)
						.map(([subType, subKeys]) => {
							return `${type} + (${subType}): ${subKeys.join(", ")}`;
						})
						.join("\n")
				);
			})
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
					keys: this.controls.forward,
					listener: this.forwardListener,
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
					keys: this.controls.decreaseSpeed,
					listener: this.decreaseSpeedListener,
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
					keys: this.controls.decreaseVolume,
					listener: this.decreaseVolumeListener,
				},
				{
					keys: this.controls.toggleMute,
					listener: this.toggleMuteListener,
				},
				{
					keys: this.controls.toggleFullscreen,
					listener: this.toggleFullscreenListener,
				},
				{
					keys: this.controls.showCurrentTime,
					listener: this.showCurrentTimeListener,
				},
				...[
					{
						keys: this.controls.backward,
						listener: this.ctrlBackwardListener,
					},
					{
						keys: this.controls.forward,
						listener: this.ctrlForwardListener,
					},
					{
						keys: this.controls.increaseSpeed,
						listener: this.ctrlIncreaseSpeedListener,
					},
					{
						keys: this.controls.decreaseSpeed,
						listener: this.ctrlDecreaseSpeedListener,
					},
					{
						keys: this.controls.increaseVolume,
						listener: this.ctrlIncreaseVolumeListener,
					},
					{
						keys: this.controls.decreaseVolume,
						listener: this.ctrlDecreaseVolumeListener,
					},
					{
						keys: this.controls.ctrl.showControls,
						listener: this.showControlsListener,
					},
					{
						keys: this.controls.ctrl.createRestorePoint,
						listener: this.createRestorePointListener,
					},
					{
						keys: this.controls.ctrl.restoreSavePoint,
						listener: this.restoreSavePointListener,
					},
					{
						keys: this.controls.ctrl.toggleLoop,
						listener: this.toggleLoopListener,
					},
					{
						keys: this.controls.ctrl.jumpToTime,
						listener: this.jumpToTimeListener,
					},
					{
						keys: this.controls.ctrl.toggleAutoActivationDomain,
						listener: this.toggleAutoActivationDomainListener,
					},
				]
					.map((obj) => {
						return {
							...obj,
							ctrlKey: true,
						};
					}),
			]
				.map(({ listener, ...rest }) => {
					return createOnKeydown({
						bypassField: true,
						listener: listener.bind(thisArg),
						...rest,
					});
				}),
		];
	}

}
