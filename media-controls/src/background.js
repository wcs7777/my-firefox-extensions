import populateControls from "./populate-controls.js";
import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable, controlsTable } from "./tables.js";

(async () => {
	populate(controlsTable, populateControls)
		.then(console.log)
		.catch(console.error);
	await populate(optionsTable, populateOptions)
		.then(console.log)
		.catch(console.error);
	if (!browser.browserAction.onClicked.hasListener(actionOnClicked)) {
		browser.browserAction.onClicked.addListener(actionOnClicked);
	}
	await updateActivated(await optionsTable.get("activated"));
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function populate(table, fn) {
	if (!await utilsTable.get(table.name)) {
		await fn(table);
		await utilsTable.set(table.name, true);
	}
	return `${table.name} populated`;
}

async function actionOnClicked() {
	try {
		const toggle = !await optionsTable.get("activated");
		await optionsTable.set("activated", toggle);
		await updateActivated(toggle);
	} catch (error) {
		console.error(error);
	}
}

async function updateActivated(activated) {
	if (activated) {
		console.log("activated");
		await browser.browserAction.setIcon({
			path: {
				16: "../icons/icon-16.png",
				32: "../icons/icon-32.png",
			},
		});
	} else {
		console.log("deactivated");
		await browser.browserAction.setIcon({
			path: {
				16: "../icons/icon-dark-16.png",
				32: "../icons/icon-dark-32.png",
			},
		});
	}
}
