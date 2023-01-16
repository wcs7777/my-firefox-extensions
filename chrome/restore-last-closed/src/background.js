import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

const browser = chrome;

(async () => {
	if (!browser.runtime.onMessage.hasListener(onMessageListener)) {
		browser.runtime.onMessage.addListener(onMessageListener);
	}
	if (!await utilsTable.get(optionsTable.name)) {
		await populateOptions(optionsTable);
		await utilsTable.set(optionsTable.name, true);
	}
	if (!browser.action.onClicked.hasListener(actionOnClicked)) {
		browser.action.onClicked.addListener(actionOnClicked);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function onMessageListener(message, sender) {
	try {
		if (message?.restore === true) {
			await restoreLastClosed(sender.tab.id);
		} else if (message?.lastClosed) {
			await utilsTable.set("lastClosed", message.lastClosed);
			return { saved: true };
		}
	} catch (error) {
		console.error(error);
	}
}

async function actionOnClicked(tab) {
	try {
		await restoreLastClosed(tab.id);
	} catch (error) {
		console.error(error);
	}
}

async function restoreLastClosed(tabId) {
	const last = await getLastClosed();
	if (last?.tab.sessionId) {
		await browser.sessions.restore(last.tab.sessionId);
	} else {
		await browser.tabs.sendMessage(
			tabId,
			{ openUrl: await utilsTable.get("lastClosed") },
		);
	}
}

async function getLastClosed() {
	const closed = await browser.sessions.getRecentlyClosed({
		maxResults: 1,
	});
	return closed?.[0];
}
