(function () {
	'use strict';

	function $(selectors, target=document) {
		return target.querySelector(selectors);
	}

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function tag(tagName) {
		return document.createElement(tagName);
	}

	function waitElement({
		selectors,
		target=document,
		timeout=0,
		interval=500,
	}={}) {
		return new Promise((resolve, reject) => {
			const selectorsArray = toArray(selectors);
			const elem = find();
			if (elem !== undefined) {
				return resolve(elem);
			}
			const idInterval = setInterval(() => {
				const element = find();
				if (element !== undefined) {
					clearTimers();
					resolve(element);
				}
			}, interval);
			const idTimeout = (
				timeout > 0 ?
				setTimeout(() => {
					clearTimers();
					reject(
						new Error(`${timeout} expired without found ${selectors}`),
					);
				}, timeout) :
				false
			);

			function find() {
				return selectorsArray.find((s) => hasChild(s, target));
			}

			function clearTimers() {
				clearInterval(idInterval);
				if (idTimeout !== false) {
					clearTimeout(idTimeout);
				}
			}

		});
	}

	function hasChild(selectors, target=document) {
		return $(selectors, target) !== null;
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

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

	function toObject(value) {
		return typeof value === "object" ? value : { [value]: value };
	}

	function min(a, b) {
		return a < b ? a : b;
	}

	function max(a, b) {
		return a > b ? a : b;
	}

	class Table {
		constructor(name="table", database) {
			this.name = name;
			this.database = database;
		}

		async get(key) {
			const table = await this.getAll();
			return !Array.isArray(key) ? table[key] : key.map((k) => table[k]);
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

		async remove(key) {
			const table = await this.getAll();
			delete table[key];
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
			const activated = await optionsTable.get("activated");
			if (activated) {
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
		await waitElement({
			selectors: ["video", "audio"],
			interval: await optionsTable.get("waitInterval"),
			timeout: await optionsTable.get("waitTimeout"),
		});
		const medias = [...$$("video"), ...$$("audio")];
		const {
			shortcut,
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
		let activated = false;
		let currentMedia = medias[0];
		for (const media of medias) {
			media.addEventListener("play", () => currentMedia = media);
		}
		document.addEventListener("keydown", (e) => {
			if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
				e.preventDefault();
				if (activated) {
					document.removeEventListener("keydown", keydownListener);
				} else {
					document.addEventListener("keydown", keydownListener);
				}
				activated = !activated;
				const message = (
					`media player control ${activated ? "" : "de"}activated`
				);
				console.log(message);
				showPopup(createPopup(), message, 1200);
			} else if (e.ctrlKey && e.key.toUpperCase() === "L") {
				e.preventDefault();
				console.log("media controls");
				const message = JSON.stringify(controls, null, 4);
				console.log(message);
				showPopup(createPopup(), message, 5000);
			}
		});

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
							createPopup(),
							currentMedia.playbackRate.toFixed(2),
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
				return media.playbackRate = min(
					media.playbackRate + speedRate,
					maxSpeed,
				);
			},
			"decreaseSpeed": () => {
				return media.playbackRate = max(
					media.playbackRate - speedRate,
					minSpeed,
				);
			},
			"resetSpeed": () => {
				return media.playbackRate = 1;
			},
			"increaseVolume": () => {
				return media.volume = min(media.volume + volumeRate, 1.00);
			},
			"decreaseVolume": () => {
				return media.volume = max(media.volume - volumeRate, 0.00);
			},
			"toggleMute": () => {
				return media.muted = !media.muted;
			},
		}[action]();
	}

	function createPopup() {
		const popup = tag("span");
		popup.style.cssText = `
		position: fixed;
		top: 100px;
		left: 80px;
		padding: 2px;
		color: rgb(255, 255, 255);
		background-color: rgba(0, 0, 0, .8);
		font: 25px/1.2 Arial, sens-serif;
		z-index: 99999;
	`;
		return popup;
	}

	function showPopup(popup, message, timeout) {
		popup.textContent = message;
		document.body.appendChild(popup);
		setTimeout(() => popup.remove(), timeout);
	}

})();
