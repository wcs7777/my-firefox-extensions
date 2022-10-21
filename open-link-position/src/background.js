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
			await updateActivated();
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
				const index = (
					await optionsTable.get("toLeft") ?
					current.index :
					current.index + 1
				);
				await moveTab(tab.id, index);
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

function moveTab(id, index) {
	return browser.tabs.move(id, { index });
}
