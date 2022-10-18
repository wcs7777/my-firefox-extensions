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
	if (!browser.tabs.onActivated.hasListener(onActivated)) {
		browser.tabs.onActivated.addListener(onActivated);
	}
	if (!browser.tabs.onRemoved.hasListener(onRemoved)) {
		browser.tabs.onRemoved.addListener(onRemoved);
	}
	await toggleOnCreatedListener();
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
		await toggleOnCreatedListener();
	} catch (error) {
		console.error(error);
	}
}

async function toggleOnCreatedListener() {
	if (await optionsTable.get("activated")) {
		console.log("activated");
		if (!browser.tabs.onCreated.hasListener(onCreated)) {
			browser.tabs.onCreated.addListener(onCreated);
		}
		await browser.browserAction.setIcon({
			path: {
				16: "../icons/icon-16.png",
				32: "../icons/icon-32.png",
			},
		});
	} else {
		console.log("deactivated");
		if (browser.tabs.onCreated.hasListener(onCreated)) {
			browser.tabs.onCreated.removeListener(onCreated);
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
			await toggleOnCreatedListener();
		}
	} catch (error) {
		console.error(error);
	}
}

async function onCreated(tab) {
	try {
		if (tab.openerTabId) {
			const current = await currentTab();
			if (current?.id === tab.openerTabId) {
				await browser.tabs.move(tab.id, { index: current.index });
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function onActivated(activeInfo) {
	try {
		if (activeInfo.previousTabId) {
			await utilsTable.set("previousTabId", activeInfo.previousTabId);
		}
	} catch (error) {
		console.error(error);
	}
}

async function onRemoved(tabId, removeInfo) {
	try {
		if (!removeInfo.isWindowClosing) {
			const previousTabId = await utilsTable.get("previousTabId");
			if (previousTabId) {
				await browser.tabs.update(previousTabId, { active: true });
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function currentTab() {
	const tabs = await browser.tabs.query(
		{ currentWindow: true, active: true },
	);
	return tabs?.[0];
}
