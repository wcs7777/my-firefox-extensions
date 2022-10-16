import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

(async () => {
	if (!await utilsTable.get(optionsTable.name)) {
		await populateOptions(optionsTable);
		await utilsTable.set(optionsTable.name, true);
	}
	if (!browser.runtime.onMessage.hasListener(onMessage)) {
		browser.runtime.onMessage.addListener(onMessage);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function onMessage(message) {
	try {
		if (message.url) {
			const current = await currentTabIndex();
			if (!isNaN(current)) {
				await browser.tabs.create({
					active: false,
					index: current,
					url: message.url,
				});
			} else {
				return false;
			}
		}
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

async function currentTabIndex() {
	const tabs = await browser.tabs.query(
		{ currentWindow: true, active: true },
	);
	return tabs?.[0]?.index;
}
