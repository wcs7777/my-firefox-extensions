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
		listeners,
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
		if (listeners) {
			for (const { type, listener } of toArray(listeners)) {
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

	function onAppend({
		selectors,
		target=document.body,
		options={ childList: true },
		listener,
		errorLogger=console.error,
	}={}) {
		const mutation = new MutationObserver((mutations) => {
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
					listener(nodes, mutation.target)?.catch(errorLogger);
					break;
				}
			}
		});
		mutation.observe(target, options);
		return mutation;
	}

	function onRemoved({
		element,
		target=document.body,
		options={ childList: true },
		listener,
		errorLogger=console.error,
	}={}) {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				const removedNodes = Array.from(mutation.removedNodes);
				if (removedNodes.some((removed) => removed.contains(element))) {
					listener(element)?.catch(errorLogger);
					observer.disconnect();
					break;
				}
			}
		});
		observer.observe(target, options);
		return observer;
	}

	function onLocationChange(listener) {
		onLocationChange.current = (
			onLocationChange.current || document.location.href
		);
		const observer = new MutationObserver(async () => {
			if (onLocationChange.current !== document.location.href) {
				onLocationChange.current = document.location.href;
				if (listener.constructor.name === "AsyncFunction") {
					await listener();
				} else {
					listener();
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		return observer;
	}

	function sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	function numbers() {
		return "0123456789";
	}

	function isNumber(character) {
		return numbers().indexOf(character) > -1;
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
				onLocationChange(() => main().catch(console.error));
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
		let activated = false;
		console.log(`shortcut: ${shortcut}`);
		console.log(`gotoShortcut: ${gotoShortcut}`);
		console.log(`initialDelay: ${initialDelay}`);
		console.log(`timeRate: ${timeRate}`);
		console.log(`timeCtrlRate: ${timeCtrlRate}`);
		console.log(`speedRate: ${speedRate}`);
		console.log(`speedCtrlRate: ${speedCtrlRate}`);
		console.log("delay begin");
		await sleep(initialDelay);
		console.log("delay end");
		listenMedias($$("video, audio"));
		onAppend({
			selectors: "video, audio",
			options: { childList: true, subtree: true },
			listener: listenMedias,
		});
		document.addEventListener("keydown", (e) => {
			if (currentMedia && e.ctrlKey && e.key.toUpperCase() === shortcut) {
				e.preventDefault();
				setActivated(!activated);
			}
		});

		function listenMedias(medias) {
			if (currentMedia == null) {
				currentMedia = medias?.[0];
			}
			for (const media of medias) {
				media.addEventListener("play", () => currentMedia = media);
				onRemoved({
					element: media,
					options: { childList: true, subtree: true },
					listener: () => {
						if (currentMedia === media) {
							currentMedia = null;
							if (activated) {
								setActivated(false);
							}
						}
					},
				});
			}
		}

		function setActivated(value) {
			activated = value;
			if (!activated) {
				document.removeEventListener("keydown", keydownListener);
				document.removeEventListener("keydown", gotoTimeListener);
				document.removeEventListener("keydown", showControlsListener);
			} else {
				document.addEventListener("keydown", keydownListener);
				document.addEventListener("keydown", gotoTimeListener);
				document.addEventListener("keydown", showControlsListener);
			}
			const message = (
				`media player control ${activated ? "" : "de"}activated`
			);
			console.log(message);
			showPopup(createPopup(message), 1200);
		}

		function gotoTimeListener(e) {
			if (e.ctrlKey && e.key.toUpperCase() === gotoShortcut) {
				e.preventDefault();
				setActivated(false);
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
					listeners: {
						type: "keydown",
						listener: (e) => {
							if (e.key === "Enter") {
								const [hours, minutes, seconds] = splitTime(e.target.value);
								currentMedia.currentTime = Math.min(
									currentMedia.duration,
									hours * 3600 + minutes * 60 + seconds,
								);
								finalize();
								return;
							} else if (e.key === "Escape") {
								finalize();
								return;
							}
							const oldValue = e.target.value;
							setTimeout(() => {
								if (!isTimeValid(e.target.value)) {
									e.target.value = oldValue;
								}
							}, 1);

							function finalize() {
								e.preventDefault();
								e.target.remove();
								setActivated(true);
							}
						},
					},
				});
				document.body.appendChild(input);
				input.focus();
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
				return media.playbackRate = Math.min(
					media.playbackRate + speedRate,
					maxSpeed,
				);
			},
			"decreaseSpeed": () => {
				return media.playbackRate = Math.max(
					media.playbackRate - speedRate,
					minSpeed,
				);
			},
			"resetSpeed": () => {
				return media.playbackRate = 1;
			},
			"increaseVolume": () => {
				return media.volume = Math.min(media.volume + volumeRate, 1.00);
			},
			"decreaseVolume": () => {
				return media.volume = Math.max(media.volume - volumeRate, 0.00);
			},
			"toggleMute": () => {
				return media.muted = !media.muted;
			},
		}[action]();
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

	function isTimeValid(time, separator=":", maxSeparators=2) {
		let separators = 0;
		let digits = 0;
		for (let i = 0; i < time.length; ++i) {
			if (isNumber(time[i])) {
				++digits;
				if (digits > 2) {
					return false;
				}
			} else if (time[i] === separator && i > 0 && isNumber(time[i - 1])) {
				digits = 0;
				++separators;
				if (separators > maxSeparators) {
					return false;
				}
			} else {
				return false;
			}
		}
		return true;
	}

	function splitTime(time, maxSeparators=2) {
		const parts = [];
		let part = "";
		for (let i = 0; i < time.length; i++) {
			if (isNumber(time[i])) {
				part += time[i];
			} else {
				parts.push(parseInt(part));
				part = "";
			}
		}
		parts.push(parseInt(part));
		for (let i = parts.length; i <= maxSeparators; ++i) {
			parts.unshift(0);
		}
		return parts;
	}

})();
