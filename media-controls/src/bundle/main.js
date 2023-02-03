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

	async function doAction({
		media,
		action,
		key,
		timeRate,
		speedRate,
		minSpeed,
		maxSpeed,
		volumeRate,
	}) {
		return {
			"begin": () => {
				return media.currentTime = 0;
			},
			"end": () => {
				return media.currentTime = media.duration;
			},
			"middle": () => {
				return media.currentTime = media.duration * (parseInt(key) / 10);
			},
			"backward": () => {
				return media.currentTime -= timeRate;
			},
			"forward": () => {
				return media.currentTime += timeRate;
			},
			"togglePlay": () => {
				return media.paused ? media.play() : media.pause();
			},
			"increaseSpeed": () => {
				return increasePlaybackRate(speedRate);
			},
			"decreaseSpeed": () => {
				return increasePlaybackRate(-speedRate);
			},
			"resetSpeed": () => {
				return media.playbackRate = 1;
			},
			"increaseVolume": () => {
				return increaseVolume(volumeRate);
			},
			"decreaseVolume": () => {
				return increaseVolume(-volumeRate);
			},
			"toggleMute": () => {
				return media.muted = !media.muted;
			},
		}[action]();

		function increasePlaybackRate(rate) {
			return media.playbackRate = threshold(
				media.playbackRate + rate,
				minSpeed,
				maxSpeed,
			);
		}

		function increaseVolume(rate) {
			return media.volume = threshold(media.volume + rate, 0.00, 1.00);
		}
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

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
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

	function onAppend({
		selectors,
		target=document.body,
		options={ childList: true },
		listener,
		onRejected=console.error,
	}={}) {
		return mutationObserverWrapper({
			target,
			options,
			mutationCallback: (mutations) => {
				for (const mutation of mutations) {
					const addedNodes = Array.from(mutation.addedNodes);
					let nodes = [];
					if (addedNodes.length > 0) {
						if (selectors) {
							nodes = $$(selectors, target).filter((element) => {
								return addedNodes.some((added) => {
									return added.contains(element);
								});
							});
						} else {
							nodes = addedNodes;
						}
					}
					if (nodes.length > 0) {
						listener(nodes, mutation.target)?.catch(onRejected);
						break;
					}
				}
			},
		});
	}

	function onRemoved({
		element,
		target=document.body,
		options={ childList: true },
		listener,
		onRejected=console.error,
	}={}) {
		return mutationObserverWrapper({
			target,
			options,
			mutationCallback: (mutations) => {
				for (const mutation of mutations) {
					const removedNodes = Array.from(mutation.removedNodes);
					if (removedNodes.some((removed) => removed.contains(element))) {
						listener(element)?.catch(onRejected);
						observer.disconnect();
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
				true
			) {
				if (preventDefault) {
					e.preventDefault();
				}			listener(e);
			}
		};
	}

	function manageEvents({ target, type, on, listeners }) {
		const manager = {
			target,
			type,
			listeners: toArray(listeners).map((listener) => {
				listener.__isOn = false;
				return listener;
			}),

			add(listeners) {
				for (const listener of toArray(listeners)) {
					if (!this.listeners.includes(listener)) {
						this.listeners.push(listener);
					}
				}
			},

			remove(listeners) {
				const list = toArray(listeners);
				this.listeners = this.listeners.filter((listener) => {
					return !list.includes(listener);
				});
			},

			on() {
				this.toggle(true);
			},

			off() {
				this.toggle(false);
			},

			/**
			 * @param {boolean} newState
			 */
			toggle(newState) {
				for (const listener of this.listeners) {
					if (listener.__isOn !== newState) {
						if (newState) {
							this.target.addEventListener(this.type, listener);
						} else {
							this.target.removeEventListener(this.type, listener);
						}
						listener.__isOn = newState;
					}
				}
			},

		};

		if (on) {
			manager.on();
		}

		return manager;
	}

	function mutationObserverWrapper({
		target=document.body,
		options={ childList: true },
		mutationCallback,
	}={}) {
		const mutation = new MutationObserver(mutationCallback);
		mutation.observe(target, options);
		return {
			beginObservation() {
				mutation.disconnect();
				return mutation.observe(target, options);
			},

			stopObservation() {
				return mutation.disconnect();
			},
		};
	}

	class MediaTimeInput {

		constructor({
			cssText,
			media,
			separator=":",
			shortcuts={ synchronizeValue: "s" },
		}={}) {
			this._input = tag({ tagName: "input", cssText });
			this._media = media;
			this._separator = separator;
			this._shortcuts = shortcuts;
			this.time = 0;
			this.cursorPosition = 0;
			this._length = this.value.length;
			this._keydownManager = {};
			this._cutManager = {};
			this._pasteManager = {};
			this.listenKeydown();
			this.listenCut();
			this.listenPaste();
		}

		addEventListener(type, listener) {
			this._input.addEventListener(type, listener);
		}

		focus() {
			this._input.focus();
		}

		prepareAppend(media) {
			if (media) {
				this._media = media;
			}
			this.time = 0;
			this.cursorPosition = 0;
			this._length = this.value.length;
			return this._input;
		}

		remove() {
			this._input.remove();
			this._input.dispatchEvent(new CustomEvent("removed"));
		}

		get isConnected() {
			return this._input.isConnected;
		}

		get value() {
			return this._input.value;
		}

		set value(newValue) {
			return this._input.value = newValue;
		}

		set time(seconds) {
			this.value = formatSeconds(parseInt(seconds), this._separator);
		}

		set digits(value) {
			for (const digit of value) {
				const position = this.cursorPosition;
				if (position >= this._length) {
					break;
				}
				this.setDigitAt(digit, position);
			}
		}

		get cursorPosition() {
			return (
				this._input.selectionDirection !== "backward" ?
				this._input.selectionStart :
				this._input.selectionEnd
			);
		}

		set cursorPosition(position) {
			const offset = threshold(position, 0, this._length - 1);
			this._input.setSelectionRange(offset, offset);
		}

		isSeparator(position) {
			return this.value[position] === this._separator;
		}

		setDigitAt(digit, position, updateCursorPosition=true) {
			if (isDigit(digit)) {
				const pos = threshold(
					!this.isSeparator(position) ? position : position + 1,
					0,
					this._length - 1,
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

		listenKeydown() {
			const self = this;
			this._keydownManager.off?.();
			this._keydownManager = manageEvents({
				target: this._input,
				type: "keydown",
				on: true,
				listeners: [
					this.guardListener,
					...[
						{
							keys: this._shortcuts.synchronizeValue,
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
							keys: this._separator,
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
								listener: listener.bind(self),
								preventDefault: false,
								...rest,
							});
						}),
				],
			});
		}

		listenCut() {
			this._cutManager.off?.();
			this._cutManager = manageEvents({
				target: this._input,
				type: "cut",
				on: true,
				listeners: (e) => e.preventDefault(),
			});
		}

		listenPaste() {
			this._pasteManager.off?.();
			this._pasteManager = manageEvents({
				target: this._input,
				type: "paste",
				on: true,
				listeners: this.pasteListener.bind(this),
			});
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
			if (position < this._length) {
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
			this.time = this._media.currentTime;
			this.cursorPosition = this.value.search(`[^0|^${this._separator}]`);
		}

		synchronizeMediaWithValue() {
			this._media.currentTime = threshold(
				formattedTimeToSeconds(this.value),
				0,
				this._media.duration,
			);
		}

		removeListener() {
			this.remove();
		}

		pasteListener(event) {
			event.preventDefault();
			this.digits = event.clipboardData.getData("text").replace(/[^\d]/g, "");
		}

	}

	function createPopup(textNode) {
		return tag({
			tagName: "span",
			textNode,
			cssText: `
			position: fixed;
			top: 100px;
			left: 80px;
			padding: 2px;
			color: rgb(255, 255, 255);
			background-color: rgba(0, 0, 0, .8);
			font: 25px/1.2 Arial, sens-serif;
			z-index: 99999;
		`,
		});
	}

	function showPopup(popup, timeout=1200) {
		document.body.appendChild(popup);
		setTimeout(() => popup.remove(), timeout);
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
	new Table("utils", database);
	const controlsTable = new Table("controls", database);

	(async () => {
		try {
			await sleep(1000);
			if (await optionsTable.get("activated")) {
				main().catch(console.error);
			} else {
				if (!browser.runtime.onMessage.hasListener(onMessage)) {
					browser.runtime.onMessage.addListener(onMessage);
				}
			}

			function onMessage({ activated }) {
				if (activated !== undefined) {
					if (activated) {
						main().catch(console.error);
						browser.runtime.onMessage.removeListener(onMessage);
					}
				}
			}
		} catch (error) {
			console.error(error);
			console.error(error?.stack);
		}
	})()
		.catch(console.error);

	async function main() {
		console.log("media controls main");
		const {
			shortcut,
			gotoShortcut,
			showControlsShortcut,
			initialDelay,
			timeRate,
			timeCtrlRate,
			speedRate,
			speedCtrlRate,
		} = await optionsTable.getAll();
		const controls = await controlsTable.getAll();
		const keysWithCtrl = [
			...controls.backward,
			...controls.forward,
			...controls.increaseSpeed,
			...controls.decreaseSpeed,
		];
		const keys = [
			...keysWithCtrl,
			...controls.begin,
			...controls.end,
			...controls.middle,
			...controls.togglePlay,
			...controls.resetSpeed,
			...controls.increaseVolume,
			...controls.decreaseVolume,
			...controls.toggleMute,
		];
		const mediaTimeInput = new MediaTimeInput({
			separator: ":",
			shortcuts: { synchronizeValue: "s" },
			media: null,
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
		let currentMedia = null;
		let inUse = false;
		let savePoint = 0;
		console.log("media controls delay begin");
		await sleep(initialDelay);
		console.log("media controls delay end");
		listenMedias(getMedias());
		const mediaAppendObserver = onAppend({
			selectors: "video, audio",
			options: { childList: true, subtree: true },
			listener: listenMedias,
		});
		document.addEventListener("keydown", toggleInUseKeydownListener);
		if (!browser.runtime.onMessage.hasListener(onMessage)) {
			browser.runtime.onMessage.addListener(onMessage);
		}

		async function keydownListener(e) {
			try {
				if (validKey(e)) {
					e.preventDefault();
					const action = Object
					.keys(controls)
					.find((action) => controls[action].includes(e.key));
					await doAction({
						media: currentMedia,
						action: action,
						key: e.key,
						timeRate: parseFloat(!e.ctrlKey ? timeRate : timeCtrlRate),
						speedRate: parseFloat(!e.ctrlKey ? speedRate : speedCtrlRate),
						minSpeed: 0.2,
						maxSpeed: 5.0,
						volumeRate: 0.05,
					});
					if (action.includes("Speed")) {
						showPopup(
							createPopup(currentMedia.playbackRate.toFixed(2)),
							200,
						);
					}
					if (action !== "togglePlay") {
						await currentMedia.play();
					}
				}
			} catch (error) {
				console.error(error);
			}
		}

		mediaTimeInput.addEventListener("removed", async () => {
			try {
				setInUse(true);
				await sleep(100);
				await currentMedia.play();
			} catch (error) {
				console.error(error);
			}
		});

		function gotoTimeListener(e) {
			if (e.ctrlKey && e.key.toUpperCase() === gotoShortcut) {
				e.preventDefault();
				setInUse(false);
				document.body.appendChild(mediaTimeInput.prepareAppend(currentMedia));
				mediaTimeInput.focus();
			}
		}

		function showControlsListener(e) {
			if (e.ctrlKey && e.key.toUpperCase() === showControlsShortcut) {
				e.preventDefault();
				console.log("media controls");
				const message = JSON.stringify(controls, null, 4);
				console.log(message);
				showPopup(createPopup(message), 5000);
			}
		}

		function createSavePoint(e) {
			if (e.ctrlKey && e.key.toUpperCase() === "P") {
				e.preventDefault();
				savePoint = currentMedia?.currentTime;
				if (savePoint != null) {
					showPopup(
						createPopup(`Save Point Created: ${formatSeconds(savePoint)}`)
					);
				}
			}
		}

		function restoreSavePoint(e) {
			if (e.ctrlKey && e.key.toUpperCase() === "U") {
				e.preventDefault();
				if (savePoint != null) {
					currentMedia.currentTime = savePoint;
					showPopup(
						createPopup(`Save Point Restored: ${formatSeconds(savePoint)}`)
					);
				}
			}
		}

		function isControlMediaKey(e) {
			return keys.includes(e.key);
		}

		function validCtrlKey(e) {
			return !e.ctrlKey || keysWithCtrl.includes(e.key);
		}

		function validKeyOnYoutube(e) {
			return (
				window.location.host !== "www.youtube.com" ||
				![
					"ArrowUp",
					"ArrowRight",
					"ArrowDown",
					"ArrowLeft",
					"k",
					"K",
					"m",
					"M",
				].includes(e.key)
			);
		}

		function validKey(e) {
			return isControlMediaKey(e) && validCtrlKey(e) && validKeyOnYoutube(e);
		}

		function onMessage({ activated }) {
			if (activated !== undefined) {
				document.removeEventListener("keydown", toggleInUseKeydownListener);
				if (activated) {
					document.addEventListener("keydown", toggleInUseKeydownListener);
					listenMedias(getMedias());
				} else {
					setInUse(false);
				}
			}
		}

		function toggleInUseKeydownListener(e) {
			if (currentMedia && e.ctrlKey && e.key.toUpperCase() === shortcut) {
				e.preventDefault();
				setInUse(!inUse);
			}
		}

		function listenMedias(medias=[]) {
			if (currentMedia == null) {
				currentMedia = getPlayingMedia(medias) || medias[0];
			}
			for (const media of medias) {
				media.addEventListener("play", () => currentMedia = media);
				onRemoved({
					element: media,
					options: { childList: true, subtree: true },
					listener: () => {
						if (currentMedia === media) {
							currentMedia = getPlayingMedia();
							if (inUse && currentMedia === undefined) {
								setInUse(false);
							}
						}
					},
				});
			}
		}

		function setInUse(value) {
			inUse = value;
			if (!inUse) {
				mediaAppendObserver.stopObservation();
				document.removeEventListener("keydown", keydownListener);
				document.removeEventListener("keydown", gotoTimeListener);
				document.removeEventListener("keydown", showControlsListener);
				document.removeEventListener("keydown", createSavePoint);
				document.removeEventListener("keydown", restoreSavePoint);
			} else {
				mediaAppendObserver.beginObservation();
				document.addEventListener("keydown", keydownListener);
				document.addEventListener("keydown", gotoTimeListener);
				document.addEventListener("keydown", showControlsListener);
				document.addEventListener("keydown", createSavePoint);
				document.addEventListener("keydown", restoreSavePoint);
			}
			const message = (
				`media player control ${inUse ? "is" : "is not"} in use`
			);
			console.log(message);
			showPopup(createPopup(message));
		}
	}

	function getMedias() {
		return $$("video, audio");
	}

	function getPlayingMedia(medias=getMedias()) {
		return medias.find((media) => !media.paused);
	}

})();
