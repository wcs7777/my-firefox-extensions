import { sleep } from "./utils/mixed.js";
import { controlsTable, optionsTable } from "./utils/tables.js";
import MainManager from "./app/MainManager.js";
import FeaturesManager from "./app/FeaturesManager.js";
import ControlsKeydownManager from "./media/ControlsKeydownManager.js";

async function main() {
	const {
		shortcut,
		jumpToTimeShortcut,
		showControlsShortcut,
		createSavePointShortcut,
		restoreSavePointShortcut,
		loopShortcut,
		synchronizeValueShortcut,
		timeRate,
		timeCtrlRate,
		speedRate,
		speedCtrlRate,
		volumeRate,
	} = await optionsTable.getAll();
	const manager = new MainManager(
		shortcut,
		new FeaturesManager(
			{
				jumpToTime: jumpToTimeShortcut,
				showControls: showControlsShortcut,
				createSavePoint: createSavePointShortcut,
				restoreSavePoint: restoreSavePointShortcut,
				loop: loopShortcut,
				synchronizeValue: synchronizeValueShortcut,
			},
			new ControlsKeydownManager({
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
				]
			}),
		),
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
