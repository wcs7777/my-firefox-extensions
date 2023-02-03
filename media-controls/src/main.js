import { formatSeconds } from "./utils/alphanumeric.js";
import doAction from "./utils/doAction.js";
import { $$ } from "./utils/domElements.js";
import { onAppend, onRemoved } from "./utils/domEvents.js";
import MediaTimeInput from "./utils/MediaTimeInput.js";
import { sleep } from "./utils/mixed.js";
import { createPopup, showPopup } from "./utils/popup.js";
import { controlsTable, optionsTable } from "./utils/tables.js";

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
