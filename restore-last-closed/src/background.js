import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

(async () => {
	if (!browser.runtime.onMessage.hasListener(onMessageListener)) {
		browser.runtime.onMessage.addListener(onMessageListener);
	}
	if (!await utilsTable.get(optionsTable.name)) {
		await populateOptions(optionsTable);
		await utilsTable.set(optionsTable.name, true);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function onMessageListener(message) {
	if (message?.restore === true) {
		return utilsTable.get("lastClosed");
	} else if (message?.lastClosed) {
		await utilsTable.set("lastClosed", message.lastClosed);
		return { saved: true };
	}
}
