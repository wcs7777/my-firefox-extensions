(function () {
	'use strict';

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function tag({
		tagName,
		id,
		className,
		attributes,
		eventListeners,
		cssText,
		textNode,
		children,
	}={}) {
		const element = document.createElement(tagName);
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
			appendChildren(element, children);
		}
		return element;
	}

	function replaceSubstringAt(str, replacement, index) {
		return (
			str.substring(0, index) +
			replacement +
			str.substring(index + replacement.length) +
			""
		);
	}

	function threshold(value, min, max) {
		return Math.max(Math.min(value, max), min);
	}

	function isDigit(value) {
		return value.toString().length === 1 && "0123456789".includes(value);
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

	function sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

	function toObject(value) {
		return typeof value === "object" ? value : { [value]: value };
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

	function onlyTimeOnKeydown(separator, e) {
		if (e === undefined) {
			e = separator;
			separator = ":";
		}
		if (
			!e.key.startsWith("Arrow") &&
			!["Home", "End"].includes(e.key) &&
			!e.ctrlKey &&
			true
		) {
			e.preventDefault();
		} else if (e.ctrlKey) {
			return;
		}
		const index = getInputCursorIndex(e.target);
		if (isDigit(e.key)) {
			setInputTimeDigitAt(e.target, e.key, index, separator);
		} else if (e.key === e.target.value[index]) {
			setInputCursorIndex(e.target, index + 1);
		} else if (e.key === "Tab") {
			setInputCursorIndex(
				e.target,
				index < 3 ? 3 :
				index < 6 ? 6 : 0
			);
		} else if (e.key === "Backspace" && index > 0) {
			const previous = index - 1;
			resetInputTimeValueAt(e.target, previous, separator);
			setInputCursorIndex(e.target, previous);
		} else if (e.key === "Delete" && index < e.target.value.length) {
			resetInputTimeValueAt(e.target, index, separator);
			setInputCursorIndex(e.target, index);
		}
	}

	function onlyTimeOnPaste(separator, e) {
		if (e === undefined) {
			e = separator;
			separator = ":";
		}
		e.preventDefault();
		const digits = e.clipboardData
			.getData("text")
			.replace(/[^\d]/g, "")
			.split("");
		const lastDigitIndex = e.target.value.length;
		for (const digit of digits) {
			const index = getInputCursorIndex(e.target);
			if (getInputCursorIndex(e.target) === lastDigitIndex) {
				break;
			}
			setInputTimeDigitAt(e.target, digit, index, separator,);
		}
	}

	function onCut(e) {
		e.preventDefault();
	}

	function setInputTimeDigitAt(input, digit, index, separator) {
		const skipped = skipSeparator(input.value, index, separator);
		replaceInputValueAt(input, digit, skipped);
		setInputCursorIndex(input, skipped + 1);
	}

	function resetInputTimeValueAt(input, index, separator) {
		if (input.value[index] !== separator) {
			replaceInputValueAt(input, "0", index);
		}
	}

	function skipSeparator(value, index, separator) {
		return (
			value[index] !== separator ?
			threshold(index, 0, value.length - 1) :
			index + 1
		);
	}

	function getInputCursorIndex(input) {
		return (
			input.selectionDirection !== "backward" ?
			input.selectionStart :
			input.selectionEnd
		);
	}

	function setInputCursorIndex(input, index) {
		input.setSelectionRange(index, index);
	}

	function replaceInputValueAt(input, replacement, index) {
		input.value = replaceSubstringAt(input.value, replacement, index);
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

	function showPopup(popup, timeout) {
		document.body.appendChild(popup);
		setTimeout(() => popup.remove(), timeout);
	}

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
		let currentMedia = null;
		let inUse = false;
		console.log("media controls delay begin");
		await sleep(initialDelay);
		console.log("media controls delay end");
		listenMedias($$("video, audio"));
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

		function gotoTimeListener(e) {
			if (e.ctrlKey && e.key.toUpperCase() === gotoShortcut) {
				const separator = ":";
				e.preventDefault();
				setInUse(false);
				const input = tag({
					tagName: "input",
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
					attributes: [
						{
							name: "value",
							value: `00${separator}00${separator}00`,
						},
					],
					eventListeners: [
						{
							type: "keydown",
							listener: onEnter,
						},
						{
							type: "keydown",
							listener: onEscape,
						},
						{
							type: "keydown",
							listener: onlyTimeOnKeydown.bind(null, separator),
						},
						{
							type: "paste",
							listener: onlyTimeOnPaste.bind(null, separator),
						},
						{
							type: "cut",
							listener: onCut,
						},
					],
				});
				document.body.appendChild(input);
				input.focus();

				async function onEnter(e) {
					if (e.key === "Enter") {
						const [hours, minutes, seconds] = [
							parseInt(e.target.value.substring(0, 2)),
							parseInt(e.target.value.substring(3, 5)),
							parseInt(e.target.value.substring(6, 8)),
						];
						currentMedia.currentTime = threshold(
							hours * 3600 + minutes * 60 + seconds,
							0,
							currentMedia.duration,
						);
						await currentMedia.play();
						finalize(e);
					}
				}

				function onEscape(e) {
					if (e.key === "Escape") {
						finalize(e);
					}
				}

				function finalize(e) {
					e.preventDefault();
					e.target.remove();
					setInUse(true);
				}
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
					listenMedias($$("video, audio"));
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
				currentMedia = medias.find((media) => !media.paused) || medias[0];
			}
			for (const media of medias) {
				media.addEventListener("play", () => currentMedia = media);
				onRemoved({
					element: media,
					options: { childList: true, subtree: true },
					listener: () => {
						if (currentMedia === media) {
							currentMedia = null;
							if (inUse) {
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
			} else {
				mediaAppendObserver.beginObservation();
				document.addEventListener("keydown", keydownListener);
				document.addEventListener("keydown", gotoTimeListener);
				document.addEventListener("keydown", showControlsListener);
			}
			const message = (
				`media player control ${inUse ? "is" : "is not"} in use`
			);
			console.log(message);
			showPopup(createPopup(message), 1200);
		}
	}

})();
