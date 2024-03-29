import populateControls from "./populate-controls.js";
import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable, controlsTable } from "./tables.js";

const browser = chrome;

(async () => {
	populate(controlsTable, populateControls)
		.then(console.log)
		.catch(console.error);
	await populate(optionsTable, populateOptions)
		.then(console.log)
		.catch(console.error);
	browser.action.onClicked.addListener(actionOnClicked);
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
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
		await optionsTable.set("activated", !await optionsTable.get("activated"));
	} catch (error) {
		console.error(error);
	}
}

async function storageOnChanged(changes) {
	try {
		if (changes[optionsTable.name]) {
			await updateActivated(await optionsTable.get("activated"));
		}
	} catch (error) {
		console.error(error);
	}
}

async function updateActivated(activated) {
	if (activated) {
		console.log("activated");
		await changeActionIcons({ iconsPrefix: "icon" });
	} else {
		console.log("deactivated");
		await changeActionIcons({ iconsPrefix: "icon-dark" });
	}
	for (const tab of await getAllTabs()) {
		browser.tabs.sendMessage(tab.id, { activated })
			.catch((reason) => {
				console.error(`Unable to send message to ${tab.url}`);
				console.error(reason);
				console.error();
			});
	}
}

function changeActionIcons({
	iconsPrefix="icon",
	iconsPath="../../icons",
	iconsExtension="png",
}={}) {
	return browser.action.setIcon({
		path: "16 19 32 38"
			.split(" ")
			.reduce((obj, size) => {
				return {
					...obj,
					[size]: `${iconsPath}/${iconsPrefix}-${size}.${iconsExtension}`,
				};
			}, {}),
	});
}

function getAllTabs() {
	return browser.tabs.query({});
}
