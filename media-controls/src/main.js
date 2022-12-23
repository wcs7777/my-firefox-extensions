import { controlsTable, optionsTable } from "./tables.js";
import {
	$$,
	isNumber,
	onAppend,
	onRemoved,
	sleep,
	tag,
} from "./utils.js";

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
	document.addEventListener("keydown", toggleInUseKeydownListener);
	if (!browser.runtime.onMessage.hasListener(onMessage)) {
		browser.runtime.onMessage.addListener(onMessage);
	}

	function onMessage({ activated }) {
		if (activated !== undefined) {
			document.removeEventListener("keydown", toggleInUseKeydownListener);
			if (activated) {
				document.addEventListener("keydown", toggleInUseKeydownListener);
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
			document.removeEventListener("keydown", keydownListener);
			document.removeEventListener("keydown", gotoTimeListener);
			document.removeEventListener("keydown", showControlsListener);
		} else {
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

	function gotoTimeListener(e) {
		if (e.ctrlKey && e.key.toUpperCase() === gotoShortcut) {
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
							setInUse(true);
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
