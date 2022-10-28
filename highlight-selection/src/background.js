import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";
import onClickedListener from "./on-clicked-listener.js";

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
	await setMenuItem();
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

async function setMenuItem() {
	await browser.menus.removeAll();
	onClickedListener.remove();
	const menuItemId = browser.menus.create({
		id: "show-highlights",
		title: "Show Highlights",
		contexts: ["all"],
	});
	onClickedListener.add(async (info, tab) => {
		try {
			if (info.menuItemId === menuItemId) {
				const data = await browser.tabs.sendMessage(
					tab.id, { getData: true },
				);
				const { id: tabIdCreated } = await browser.tabs.create({
					url: "highlights.html",
					index: tab.index + 1,
					active: true,
				});
				const onMessage = ({ getData }, sender, sendResponse) => {
					if (getData && sender?.tab.id === tabIdCreated) {
						browser.runtime.onMessage.removeListener(onMessage);
						sendResponse(data);
					}
				};
				browser.runtime.onMessage.addListener(onMessage);
			}
		} catch (error) {
			console.error(error);
		}
	});
}
