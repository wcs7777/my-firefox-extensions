import MainManager from "./app/MainManager.js";
import ControlsManager from "./media/ControlsManager.js";
import MediaTimeInput from "./media/MediaTimeInput.js";
import { sleep } from "./utils/mixed.js";
import { controlsTable, optionsTable } from "./utils/tables.js";

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
					width: 8rem;
					height: 40px;
					top: 50%;
					left: 50%;
					margin-top: -20px;
					margin-left: -50px;
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
