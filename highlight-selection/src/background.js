import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";
import {
	createMenuItem,
	onClickedListeners,
} from "./menu-items.js";

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
	await updateActivated(await optionsTable.get("activated"));
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

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
		await setMenuItems();
	} else {
		console.log("deactivated");
		await changeActionIcons({ iconsPrefix: "icon-dark" });
		await removeMenuItems();
	}
}

function changeActionIcons({
	iconsPrefix="icon",
	iconsPath="../icons",
	iconsExtension="png",
}={}) {
	return browser.browserAction.setIcon({
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

async function setMenuItems() {
	await removeMenuItems();
	const parentId = createMenuItem({
		id: "parent",
		title: "Highlight",
		contexts: ["all"],
	});
	const showId = createMenuItem({
		id: "show-highlights",
		title: "Show Highlights",
		contexts: ["all"],
		parentId,
	});
	const highlightId = createMenuItem({
		id: "highlight-selection",
		title: "Highlight Selection",
		contexts: ["selection"],
		parentId,
	});
	onClickedListeners.add(async (info, tab) => {
		try {
			if (info.menuItemId === showId) {
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
	onClickedListeners.add(async (info, tab) => {
		try {
			if (info.menuItemId === highlightId) {
				await browser.tabs.sendMessage(tab.id, { highlight: true });
			}
		} catch (error) {
			console.error(error);
		}
	});
}

async function removeMenuItems() {
	await browser.menus.removeAll();
	onClickedListeners.removeAll();
}
