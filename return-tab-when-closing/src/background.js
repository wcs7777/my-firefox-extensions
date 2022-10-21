import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

let listPreviousTabId = [];
let currentTabId = 0;

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
		if (!browser.tabs.onRemoved.hasListener(onRemoved)) {
			browser.tabs.onRemoved.addListener(onRemoved);
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
		if (browser.tabs.onRemoved.hasListener(onRemoved)) {
			browser.tabs.onRemoved.removeListener(onRemoved);
		}
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
			currentTabId = tabId;
			listPreviousTabId.push(previousTabId);
		}
	} catch (error) {
		console.error(error);
	}
}

async function onRemoved(tabId, { isWindowClosing }) {
	try {
		console.log(`tabId removed: ${tabId}`);
		listPreviousTabId = listPreviousTabId.filter((tab) => tab !== tabId);
		if (
			!isWindowClosing &&
			currentTabId === tabId &&
			listPreviousTabId.length > 0 &&
			true
		) {
			await activeTab(listPreviousTabId.pop());
			listPreviousTabId.pop();
		}
	} catch (error) {
		console.error(error);
	}
}

function activeTab(id) {
	return browser.tabs.update(id, { active: true });
}
