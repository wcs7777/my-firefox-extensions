(function () {
	'use strict';

	function threshold(value, min, max) {
		return Math.max(Math.min(value, max), min);
	}

	function isDigit(value) {
		return value.toString().length === 1 && "0123456789".includes(value);
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function replaceSubstringAt(str, replacement, index) {
		return (
			str.substring(0, index) +
			replacement +
			str.substring(index + replacement.length) +
			""
		);
	}

	function formattedTimeToSeconds(time) {
		const hours = parseInt(time.slice(0, 2));
		const minutes = parseInt(time.slice(3, 5));
		const seconds = parseInt(time.slice(6, 8));
		return hours * 3600 + minutes * 60 + seconds;
	}

	function formatSeconds(seconds, separator=":") {
		return [
			parseInt(seconds / 3600),
			parseInt(seconds % 3600 / 60),
			seconds % 60,
		]
			.map((value) => parseInt(value))
			.map((value) => padZero(value))
			.join(separator);
	}

	function padZero(value) {
		return value.toString().padStart(2, "0");
	}

	function sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

	function toObject(value) {
		return typeof value === "object" ? value : { [value]: value };
	}

	function $(selectors, target=document) {
		return target.querySelector(selectors);
	}

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function currentDomain() {
		return window.location.hostname || window.location.protocol;
	}

	/**
	 * @param {string} message
	 * @param {number} timeout
	 */
	function flashMessage(message, timeout=1200, fontSize=25) {
		console.log(message);
		flashElement(
			createPopup(
				message
					.split("\n")
					.map((line) => {
						return tag({
							tagName: "p",
							textNode: line,
							cssText: `
							margin: 0 0 3px;
							padding: 0;
						`
						});
					}),
				fontSize,
			),
			timeout,
			document.body,
		);
	}

	function flashElement(element, timeout=1200, target=document.body) {
		target.appendChild(element);
		setTimeout(() => element.remove(), timeout);
	}

	function createPopup(children, fontSize=25) {
		return tag({
			tagName: "div",
			children,
			cssText: `
			position: fixed;
			top: 100px;
			left: 80px;
			padding: 16px 16px 13px;
			color: rgb(255, 255, 255);
			background-color: rgba(0, 0, 0, .85);
			font: ${fontSize}px/1.2 Arial, sens-serif;
			z-index: 99999;
		`,
		});
	}

	function tag({
		tagName,
		id,
		is,
		className,
		attributes,
		eventListeners,
		cssText,
		textNode,
		children,
	}={}) {
		const element = document.createElement(tagName, { is });
		if (id) {
			element.id = id;
		}
		if (className) {
			element.className = className;
		}
		if (attributes) {
			for (const { name, value } of toArray(attributes)) {
				element.setAttribute(name, value);
			}
		}
		if (eventListeners) {
			for (const { type, listener } of toArray(eventListeners)) {
				element.addEventListener(type, listener);
			}
		}
		if (cssText) {
			element.style.cssText = cssText;
		}
		if (textNode) {
			element.appendChild(document.createTextNode(textNode));
		}
		if (children) {
			for (const child of toArray(children)) {
				element.appendChild(child);
			}
		}
		return element;
	}

	class MutationObserverClosure {

		constructor({
			target=document.body,
			options={
				childList: true,
				subtree: false,
				attributes: false,
				attributeOldValue: false,
				characterData: false,
				characterDataOldValue: false,
			},
			observe=true,
			mutationCallback,
		}={}) {
			this.mutationObserver = new MutationObserver(mutationCallback);
			this.target = target;
			this.options = options;
			if (observe) {
				this.observe();
			}
		}

		observe() {
			this.mutationObserver.observe(this.target, this.options);
		}

		disconnect() {
			this.mutationObserver.disconnect();
		}

		takeRecords() {
			return this.mutationObserver.takeRecords();
		}

	}

	function waitElement({
		selectors,
		target=document.body,
		interval=100,
		timeout=20000,
	}={}) {
		return new Promise((resolve, reject) => {
			const idInterval = setInterval(searchElement, interval);
			const idTimeout = setTimeout(() => {
				clear();
				reject(`${selectors} not found in ${timeout}ms`);
			}, timeout);

			function searchElement() {
				const element = $(selectors, target);
				if (element) {
					clear();
					resolve(element);
				}
			}

			function clear() {
				clearInterval(idInterval);
				clearTimeout(idTimeout);
			}
		});
	}

	function onAppend({
		selectors,
		target=document.body,
		options={
			childList: true,
			subtree: false,
			attributes: false,
			attributeOldValue: false,
			characterData: false,
			characterDataOldValue: false,
		},
		observe=true,
		listener,
	}={}) {
		return new MutationObserverClosure({
			target,
			options,
			observe,
			mutationCallback: (mutationRecords) => {
				for (const mutationRecord of mutationRecords) {
					const addedNodes = Array.from(mutationRecord.addedNodes);
					let nodes = [];
					if (addedNodes.length > 0) {
						if (selectors) {
							nodes = $$(selectors, target).filter((queried) => {
								return addedNodes.some((node) => node.contains(queried));
							});
						} else {
							nodes = addedNodes;
						}
					}
					if (nodes.length > 0) {
						listener(nodes, mutationRecord.target);
						break;
					}
				}
			},
		});
	}

	function onRemoved({
		element,
		target=document.body,
		options={
			childList: true,
			subtree: false,
			attributes: false,
			attributeOldValue: false,
			characterData: false,
			characterDataOldValue: false,
		},
		observe=true,
		listener,
	}={}) {
		return new MutationObserverClosure({
			target,
			options,
			observe,
			mutationCallback: (mutationRecords, mutationObserver) => {
				for (const mutationRecord of mutationRecords) {
					const removedNodes = Array.from(mutationRecord.removedNodes);
					if (removedNodes.some((removed) => removed.contains(element))) {
						listener(element);
						mutationObserver.disconnect();
						break;
					}
				}
			},
		});
	}

	function createOnKeydown({
		keys,
		caseSensitive=true,
		ctrlKey=false,
		altKey=false,
		shiftKey=false,
		preventDefault=true,
		bypassField=false,
		listener,
	}={}) {
		const onKeys = (
			caseSensitive ?
			toArray(keys) :
			toArray(keys).map((key) => key.toLowerCase())
		);
		return (e) => {
			if (
				onKeys.includes(caseSensitive ? e.key : e.key.toLowerCase()) &&
				e.ctrlKey === ctrlKey &&
				e.altKey === altKey &&
				e.shiftKey === shiftKey &&
				(!bypassField || !isField(e)) &&
				true
			) {
				if (preventDefault) {
					e.preventDefault();
				}			listener(e);
			}
		};

		function isField(event) {
			const tagName = event.target.tagName.toLowerCase();
			return (
				["input", "textarea"].includes(tagName) ||
				event.target.hasAttribute("contenteditable") ||
				false
			);
		}
	}

	class EventsManager {

		constructor({ target, type, listeners, on }) {
			this.target = target;
			this.type = type;
			this._state = false;
			this.listeners = toArray(listeners);
			if (on) {
				this.on();
			}
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
				if (newState) {
					for (const listener of this.listeners) {
						this.target.addEventListener(this.type, listener);
					}
				} else {
					for (const listener of this.listeners) {
						this.target.removeEventListener(this.type, listener);
					}
				}
				this._state = newState;
			}
		}

		add(listeners) {
			for (const listener of toArray(listeners)) {
				if (!this.listeners.includes(listener)) {
					this.listeners.push(listener);
					if (this.state) {
						this.target.addEventListener(this.type, listener);
					}
				}
			}
		}

		remove(listeners) {
			const arr = toArray(listeners);
			this.listeners = this.listeners.filter((listener) => {
				const includes = arr.includes(listener);
				if (includes && this.state) {
					this.target.removeEventListener(this.type, listener);
				}
				return !includes;
			});
		}

		toggle() {
			this.state ? this.off() : this.on();
		}

		on() {
			this.state = true;
		}

		off() {
			this.state = false;
		}

	}

	var localStorage = {
		async set(key, value) {
			const keys = value !== undefined ? { [key]: value } : key;
			return browser.storage.local.set(keys);
		},

		async get(key) {
			const result = await browser.storage.local.get(key);
			return isString(key) ? result[key] : result;
		},

		async remove(keys) {
			return browser.storage.local.remove(keys);
		},

		async getAll() {
			return browser.storage.local.get();
		},
	};

	class Table {
		constructor(name="table", database) {
			this.name = name;
			this.database = database;
		}

		async get(key) {
			const table = await this.getAll();
			return (
				!Array.isArray(key) ?
				table[key] :
				key.reduce((obj, k) => {
					return { ...obj, [k]: table[k] };
				}, {})
			);
		}

		async set(key, value) {
			let table = await this.getAll();
			if (value !== undefined) {
				table[key] = value;
			} else {
				if (Array.isArray(table)) {
					table = [...table, ...toArray(key)];
				} else {
					table = { ...table, ...toObject(key) };
				}
			}
			return this.database.set(this.name, table);
		}

		async getAll() {
			return await this.database.get(this.name) || {};
		}

		async getKeys() {
			return Object.keys(await this.getAll());
		}

		async remove(keys) {
			const table = await this.getAll();
			for (const key of toArray(keys)) {
				delete table[key];
			}
			return this.database.set(this.name, table);
		}

		async removeAll() {
			return this.database.remove(this.name);
		}
	}

	const database = localStorage;
	const optionsTable = new Table("options", database);
	const controlsTable = new Table("controls", database);
	const domainsTable = new Table("domains", database);

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} location
	 */
	function jumpTo(media, location) {
		return media.currentTime = location;
	}

	/**
	 * @param {HTMLMediaElement} media
	 */
	function jumpToBegin(media) {
		return jumpTo(media, 0);
	}

	/**
	 * @param {HTMLMediaElement} media
	 */
	function jumpToEnd(media) {
		return jumpTo(media, media.duration);
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} percentage
	 */
	function jumpToMiddle(media, percentage) {
		return jumpTo(media, media.duration * percentage);
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 */
	function forward(media, rate) {
		return jumpTo(media, media.currentTime + rate);
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 */
	function backward(media, rate) {
		return forward(media, -rate);
	}

	/**
	 * @param {HTMLMediaElement} media
	 */
	async function togglePlay(media) {
		return media.paused ? media.play() : media.pause();
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 * @param {number} min
	 * @param {number} max
	 */
	function increaseSpeed(media, rate, min=0, max=5) {
		return media.playbackRate = threshold(
			media.playbackRate + rate, min, max
		);
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 * @param {number} min
	 * @param {number} max
	 */
	function decreaseSpeed(media, rate, min=0, max=5) {
		return increaseSpeed(media, -rate, min, max);
	}

	/**
	 * @param {HTMLMediaElement} media
	 */
	function resetSpeed(media) {
		return media.playbackRate = 1;
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 */
	function increaseVolume(media, rate) {
		return media.volume = threshold(media.volume + rate, 0, 1);
	}

	/**
	 * @param {HTMLMediaElement} media
	 * @param {number} rate
	 */
	function decreaseVolume(media, rate) {
		return increaseVolume(media, -rate);
	}

	/**
	 * @param {HTMLMediaElement} media
	 */
	function toggleMute(media) {
		return media.muted = !media.muted;
	}

	class ControlsManager extends EventsManager {

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

		async jumpToBeginListener() {
			try {
				jumpToBegin(this.media);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		jumpToEndListener() {
			jumpToEnd(this.media);
		}

		async jumpToMiddleListener({ key }) {
			try {
				jumpToMiddle(this.media, parseInt(key) / 10);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		async forwardListener() {
			try {
				forward(this.media, this.rates.time);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		async ctrlForwardListener() {
			try {
				forward(this.media, this.rates.ctrl.time);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		async backwardListener() {
			try {
				backward(this.media, this.rates.time);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		async ctrlBackwardListener() {
			try {
				backward(this.media, this.rates.ctrl.time);
				await this.resumeMedia();
			} catch (error) {
				console.error(error);
			}
		}

		async togglePlayListener() {
			try {
				await togglePlay(this.media);
			} catch (error) {
				console.error(error);
			}
		}

		increaseSpeedListener() {
			increaseSpeed(
				this.media, this.rates.speed, this.minSpeed, this.maxSpeed
			);
			this.showMediaSpeed();
		}

		ctrlIncreaseSpeedListener() {
			increaseSpeed(
				this.media, this.rates.ctrl.speed, this.minSpeed, this.maxSpeed
			);
			this.showMediaSpeed();
		}

		decreaseSpeedListener() {
			decreaseSpeed(
				this.media, this.rates.speed, this.minSpeed, this.maxSpeed
			);
			this.showMediaSpeed();
		}

		ctrlDecreaseSpeedListener() {
			decreaseSpeed(
				this.media, this.rates.ctrl.speed, this.minSpeed, this.maxSpeed
			);
			this.showMediaSpeed();
		}

		resetSpeedListener() {
			resetSpeed(this.media);
			this.showMediaSpeed();
		}

		increaseVolumeListener() {
			increaseVolume(this.media, this.rates.volume);
		}

		ctrlIncreaseVolumeListener() {
			increaseVolume(this.media, this.rates.ctrl.volume);
		}

		decreaseVolumeListener() {
			decreaseVolume(this.media, this.rates.volume);
		}

		ctrlDecreaseVolumeListener() {
			decreaseVolume(this.media, this.rates.ctrl.volume);
		}

		toggleMuteListener() {
			toggleMute(this.media);
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
			flashMessage(`${current} / ${total} | ${percentage}%`);
		}

		showControlsListener() {
			flashMessage(this.toString(), 5000, 16);
		}

		createRestorePointListener() {
			this.savePoint = this.media.currentTime;
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

	function getMedias() {
		return $$("video, audio");
	}

	function getCurrentMedia(medias=getMedias()) {
		return medias.find((media) => !media.isPaused) || medias?.[0];
	}

	class MainManager extends EventsManager {

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
					bypassField: true,
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
					this.toggleControlsManager();
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

	class MediaTimeInput {

		constructor({
			cssText,
			media,
			separator=":",
			shortcuts={ synchronizeValue: "s" },
		}={}) {
			this.input = tag({ tagName: "input", cssText });
			this.media = media;
			this.separator = separator;
			this.shortcuts = shortcuts;
			this.time = 0;
			this.cursorPosition = 0;
			this.length = this.value.length;
			this.keydownManager = this.createKeydownManager();
			this.cutManager = new EventsManager({
				target: this.input,
				type: "cut",
				listeners: (e) => e.preventDefault(),
			});
			this.pasteManager = new EventsManager({
				target: this.input,
				type: "paste",
				listeners: this.pasteListener.bind(this),
			});
		}

		addEventListener(type, listener) {
			this.input.addEventListener(type, listener);
		}

		focus() {
			this.input.focus();
		}

		prepareAppend(media) {
			if (media) {
				this.media = media;
			}
			this.time = 0;
			this.cursorPosition = 0;
			this.length = this.value.length;
			this.keydownManager.on();
			this.cutManager.on();
			this.pasteManager.on();
			return this.input;
		}

		remove() {
			this.keydownManager.off();
			this.cutManager.off();
			this.pasteManager.off();
			this.input.remove();
			this.input.dispatchEvent(new CustomEvent("removed"));
		}

		get isConnected() {
			return this.input.isConnected;
		}

		get value() {
			return this.input.value;
		}

		set value(newValue) {
			return this.input.value = newValue;
		}

		/**
		 * @param {number|string} seconds
		 */
		set time(seconds) {
			this.value = formatSeconds(parseInt(seconds), this.separator);
		}

		/**
		 * @param {string} value
		 */
		set digits(value) {
			for (const digit of value) {
				const position = this.cursorPosition;
				if (position >= this.length) {
					break;
				}
				this.setDigitAt(digit, position);
			}
		}

		get cursorPosition() {
			return (
				this.input.selectionDirection !== "backward" ?
				this.input.selectionStart :
				this.input.selectionEnd
			);
		}

		set cursorPosition(position) {
			const offset = threshold(position, 0, this.length - 1);
			this.input.setSelectionRange(offset, offset);
		}

		isSeparator(position) {
			return this.value[position] === this.separator;
		}

		setDigitAt(digit, position, updateCursorPosition=true) {
			if (isDigit(digit)) {
				const pos = threshold(
					!this.isSeparator(position) ? position : position + 1,
					0,
					this.length - 1,
				);
				this.value = replaceSubstringAt(this.value, digit, pos);
				if (updateCursorPosition) {
					this.cursorPosition = pos + 1;
				}
			}
		}

		resetDigitAt(position) {
			this.setDigitAt("0", position, false);
			this.cursorPosition = position;
		}

		guardListener(event) {
			if (
				!event.key.startsWith("Arrow") &&
				!["Home", "End"].includes(event.key) &&
				!event.ctrlKey &&
				true
			) {
				event.preventDefault();
			}
		}

		digitListener(event) {
			this.setDigitAt(event.key, this.cursorPosition, true);
		}

		separatorListener() {
			this.cursorPosition = this.cursorPosition + 1;
		}

		backspaceListener() {
			const position = this.cursorPosition;
			if (position > 0) {
				this.resetDigitAt(position - 1);
			}
		}

		deleteListener() {
			const position = this.cursorPosition;
			if (position < this.length) {
				this.resetDigitAt(position);
			}
		}

		goToNextUnitListener() {
			const position = this.cursorPosition;
			this.cursorPosition = (
				position < 3 ? 3 :
				position < 6 ? 6 : 0
			);
		}

		goToPreviousUnitListener() {
			const position = this.cursorPosition;
			this.cursorPosition = (
				position < 3 ? 6 :
				position < 6 ? 0 : 3
			);
		}

		moveCursorForward() {
			this.cursorPosition = this.cursorPosition + 1;
		}

		moveCursorBackward() {
			this.cursorPosition = this.cursorPosition - 1;
		}

		synchronizeValueWithMedia() {
			this.time = this.media.currentTime;
			this.cursorPosition = this.value.search(`[^0|^${this.separator}]`);
		}

		synchronizeMediaWithValue() {
			this.media.currentTime = threshold(
				formattedTimeToSeconds(this.value),
				0,
				this.media.duration,
			);
		}

		removeListener() {
			this.remove();
		}

		pasteListener(event) {
			event.preventDefault();
			this.digits = event.clipboardData.getData("text").replace(/[^\d]/g, "");
		}

		createKeydownManager() {
			const thisArg = this;
			return new EventsManager({
				target: this.input,
				type: "keydown",
				on: true,
				listeners: [
					this.guardListener,
					...[
						{
							keys: this.shortcuts.synchronizeValue,
							caseSensitive: false,
							ctrlKey: true,
							preventDefault: true,
							listener: this.synchronizeValueWithMedia,
						},
						{
							keys: "0123456789".split(""),
							listener: this.digitListener,
						},
						{
							keys: this.separator,
							listener: this.separatorListener,
						},
						{
							keys: "Backspace",
							listener: this.backspaceListener,
						},
						{
							keys: "Delete",
							listener: this.deleteListener,
						},
						{
							keys: "Tab",
							listener: this.goToNextUnitListener,
						},
						{
							keys: "Tab",
							shiftKey: true,
							listener: this.goToPreviousUnitListener,
						},
						{
							keys: [" ", "l"],
							listener: this.moveCursorForward,
						},
						{
							keys: "h",
							listener: this.moveCursorBackward,
						},
						{
							keys: " ",
							shiftKey: true,
							listener: this.moveCursorBackward,
						},
						{
							keys: "Enter",
							listener: this.synchronizeMediaWithValue,
						},
						{
							keys: ["Enter", "Escape"],
							listener: this.removeListener,
						},
					]
						.map(({ listener, ...rest }) => {
							return createOnKeydown({
								listener: listener.bind(thisArg),
								preventDefault: false,
								...rest,
							});
						}),
				],
			});
		}

	}

	async function main() {
		const {
			shortcut,
			synchronizeValueShortcut,
			timeRate,
			timeCtrlRate,
			speedRate,
			speedCtrlRate,
			volumeRate,
		} = await optionsTable.getAll();
		const manager = new MainManager(
			shortcut,
			new ControlsManager({
				controls: await controlsTable.getAll(),
				maxSpeed: 5.00,
				minSpeed: 0.25,
				rates: {
					time: timeRate,
					speed: speedRate,
					volume: volumeRate,
					ctrl: {
						time: timeCtrlRate,
						speed: speedCtrlRate,
					},
				},
				exceptionConditions: [
					youtubeExceptionCondition,
				],
				mediaTimeInput: new MediaTimeInput({
					shortcuts: { synchronizeValue: synchronizeValueShortcut },
					separator: ":",
					cssText: `
					position: fixed;
					width: 12rem;
					height: 4rem;
					top: 50%;
					left: 50%;
					margin-top: -4rem;
					margin-left: -12rem;
					padding: 10px;
					color: rgb(255, 255, 255);
					background-color: rgba(0, 0, 0, .8);
					font: 25px/1.2 Arial, sens-serif;
					text-align: center;
					z-index: 99999;
				`,
				}),
			}),
		);
		if (!browser.runtime.onMessage.hasListener(activatedOnMessage)) {
			browser.runtime.onMessage.addListener(activatedOnMessage);
		}
		if (await manager.controlsManager.autoActivate(currentDomain())) {
			manager.controlsManager.media = await waitElement({
				selectors: "audio, video",
				interval: 500,
				timeout: 3000,
			});
			manager.controlsManager.on();
		}

		function activatedOnMessage({ activated }) {
			if (activated != null) {
				manager.state = activated;
			}
		}
	}

	function youtubeExceptionCondition(event) {
		return (
			window.location.host === "www.youtube.com" &&
			[
				"ArrowUp",
				"ArrowRight",
				"ArrowDown",
				"ArrowLeft",
				"k",
				"K",
				"m",
				"M",
				"c",
				"C",
				"f",
				"F",
				"t",
				"T",
			].includes(event.key) &&
			true
		);
	}

	(async () => {
		try {
			await sleep(1000);
			if (await optionsTable.get("activated")) {
				await main();
			} else {
				if (!browser.runtime.onMessage.hasListener(deactivatedOnMessage)) {
					browser.runtime.onMessage.addListener(deactivatedOnMessage);
				}
			}

			async function deactivatedOnMessage({ activated }) {
				try {
					if (activated === true) {
						browser.runtime.onMessage.removeListener(deactivatedOnMessage);
						await main();
					}
				} catch (error) {
					console.error(error);
				}
			}

		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);

})();
