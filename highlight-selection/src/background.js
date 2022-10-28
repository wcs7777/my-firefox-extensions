import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

(async () => {
	if (!await utilsTable.get(optionsTable.name)) {
		await populateOptions(optionsTable);
		await utilsTable.set(optionsTable.name, true);
	}
	if (!browser.browserAction.onClicked.hasListener(actionOnClicked)) {
		browser.browserAction.onClicked.addListener(actionOnClicked);
	}
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function actionOnClicked() {
	try {
		await optionsTable.set(
			"activated",
			!await optionsTable.get("activated"),
		);
		await updateActivated();
	} catch (error) {
		console.error(error);
	}
}

async function storageOnChanged(changes) {
	try {
		if (changes[optionsTable.name]) {
			await updateActivated();
		}
	} catch (error) {
		console.error(error);
	}
}

async function updateActivated() {
	if (await optionsTable.get("activated")) {
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
