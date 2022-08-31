import { controlsTable, optionsTable } from "./tables.js";
import {
	$$,
	max,
	min,
	onLocationChange,
	tag,
	waitForElement,
} from "./utils.js";

(async () => {
	try {
		const activated = await optionsTable.get("activated");
		if (activated) {
			main().catch(console.error);
			onLocationChange(() => main().catch(console.error))
		}
	} catch (error) {
		console.error(error);
		console.error(error?.stack);
	}
})()
	.catch(console.error);

async function main() {
	await waitForElement(["video", "audio"], 250, 8000);
	const medias = [...$$("video"), ...$$("audio")];
	if (medias.length > 0) {
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
		let activated = true;
		let currentMedia = medias[0];
		for (const media of medias) {
			media.addEventListener("play", () => currentMedia = media);
		}
		document.addEventListener("keydown", keydownListener);
		document.addEventListener("keydown", (e) => {
			if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
				e.preventDefault();
				if (activated) {
					document.removeEventListener("keydown", keydownListener);
				} else {
					document.addEventListener("keydown", keydownListener);
				}
				activated = !activated;
				console.log(`media player control ${activated ? "" : "de"}activated`);
			} else if (e.ctrlKey && e.key.toUpperCase() === "L") {
				e.preventDefault();
				console.log("media controls");
				console.log(JSON.stringify(controls, null, 4));
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
					const currentSpeed = currentMedia.playbackRate;
					const action = Object
						.keys(controls)
						.find((action) => controls[action].includes(e.key));
					await doAction({
						media: currentMedia,
						action: action,
						key: e.key,
						timeRate: parseFloat(!e.ctrlKey ? timeRate : timeCtrlRate),
						speedRate: parseFloat(!e.ctrlKey ? speedRate : speedCtrlRate),
					});
					if (currentSpeed !== currentMedia.playbackRate) {
						speedThreshold(currentMedia, 0.2, 5.0);
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
}

async function doAction({ media, action, key, timeRate, speedRate }) {
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
			return media.playbackRate += speedRate;
		},
		"decreaseSpeed": () => {
			return media.playbackRate -= speedRate;
		},
		"resetSpeed": () => {
			return media.playbackRate = 1;
		},
		"increaseVolume": () => {
			return media.volume = min(media.volume + 0.05, 1.00);
		},
		"decreaseVolume": () => {
			return media.volume = max(media.volume - 0.05, 0.00);
		},
		"toggleMute": () => {
			return media.muted = !media.muted;
		},
	}[action]();
}

function speedThreshold(media, minSpeed, maxSpeed) {
	media.playbackRate = max(media.playbackRate, minSpeed);
	media.playbackRate = min(media.playbackRate, maxSpeed);
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
