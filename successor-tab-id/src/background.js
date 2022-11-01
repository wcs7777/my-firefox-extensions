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
	await updateActivated();
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

async function updateActivated() {
	if (await optionsTable.get("activated")) {
		console.log("activated");
		if (!browser.tabs.onActivated.hasListener(onActivated)) {
			browser.tabs.onActivated.addListener(onActivated);
		}
		await browser.browserAction.setIcon({
			path: {
				16: "../icons/icon-16.png",
				32: "../icons/icon-32.png",
			},
		});
	} else {
		console.log("deactivated");
		if (browser.tabs.onActivated.hasListener(onActivated)) {
			browser.tabs.onActivated.removeListener(onActivated);
		}
		await setAllSuccessorToNone();
		await browser.browserAction.setIcon({
			path: {
				16: "../icons/icon-dark-16.png",
				32: "../icons/icon-dark-32.png",
			},
		});
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

async function onActivated({ tabId, previousTabId }) {
	try {
		if (previousTabId) {
			await setSuccessor(
				tabId,
				previousTabId,
				await optionsTable.get("insert"),
			);
		}
	} catch (error) {
		console.error(error);
	}
}

function setSuccessor(tabId, successorId, insert=true) {
	return browser.tabs.moveInSuccession(
		[tabId],
		successorId,
		{
			append: false,
			insert,
		},
	);
}

async function setAllSuccessorToNone() {
	for (const { id } of await browser.tabs.query({ currentWindow: true })) {
		await setSuccessor(id, browser.tabs.TAB_ID_NONE);
	}
}
