import populateOptions from "../utils/populate-options.js";
import { optionsTable, utilsTable } from "../utils/tables.js";
import { isString } from "../utils/utils.js";

const marks = {};
let contextMenusListeners = {};

(async () => {
	if (!await utilsTable.get(optionsTable.name)) {
		await populateOptions(optionsTable);
		await utilsTable.set(optionsTable.name, true);
	}
	if (!browser.menus.onClicked.hasListener(onContextMenuClicked)) {
		browser.menus.onClicked.addListener(onContextMenuClicked);
	}
	if (!browser.tabs.onRemoved.hasListener(onRemovedTab)) {
		browser.tabs.onRemoved.addListener(onRemovedTab);
	}
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
	}
	await resetContextMenus();
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function resetContextMenus() {
	contextMenusListeners = {};
  await browser.menus.removeAll();
	createContextMenus(await optionsTable.get("accessKey"));
}

function createContextMenus(accessKey) {
	createContextMenu({
		id: "add-scroll-mark",
		title: `&${accessKey} - Add scroll mark`,
		contexts: ["all"],
		listener: addScrollMarkListener,
	});
}

async function addScrollMarkListener(info, tab) {
	try {
		addScrollMark(
			tab.id,
			await browser.tabs.sendMessage(
				tab.id,
				{ getCurrentScroll: true },
				{ frameId: info.frameId },
			),
		);
		console.log(marks);
	} catch (error) {
		console.error(error);
	}
}

function addScrollMark(tabId, scroll) {
	if (!marks[tabId]) {
		marks[tabId] = [];
	}
	marks[tabId].push(scroll);
}

function createContextMenu({ id, title, parentId, contexts, listener }) {
	const contextMenuId = browser.menus.create({
		id,
		title,
		parentId,
		contexts,
	});
	if (listener) {
		contextMenusListeners[id] = listener;
	}
	return contextMenuId;
}

function onContextMenuClicked(info, tab) {
	contextMenusListeners[info.menuItemId]?.(info, tab);
}

function onRemovedTab(tabId) {
	marks[tabId] = null;
}

async function storageOnChanged(changes) {
	try {
		if (changes[optionsTable.name]) {
			await resetContextMenus();
		}
	} catch (error) {
		console.error(error);
	}
}
