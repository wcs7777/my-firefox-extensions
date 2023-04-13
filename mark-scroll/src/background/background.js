import populateOptions from "../utils/populate-options.js";
import { optionsTable, utilsTable } from "../utils/tables.js";
import { isString } from "../utils/utils.js";

const marks = {};
let contextMenusListeners = {};
let maxMarks = 1;

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
	maxMarks = parseInt(await optionsTable.get("maxMarks"));
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
	const parentId = createContextMenu({
		id: "mark-scroll",
		title: `&${accessKey} - Mark Scroll`,
		contexts: ["all"],
	});
	const addParentId = createContextMenu({
		id: "add-mark-scroll-entry",
		title: "&Add",
		contexts: ["all"],
		parentId,
	});
	const goToParentId = createContextMenu({
		id: "go-to-mark-scroll-entry",
		title: "&Go",
		contexts: ["all"],
		parentId,
	});
	for (let i = 1; i <= maxMarks; ++i) {
		createContextMenu({
			id: `add-mark-scroll-${i}`,
			title: `${i} mark`,
			parentId: addParentId,
			contexts: ["all"],
			listener: addScrollMarkListener.bind(null, i - 1),
		});
		createContextMenu({
			id: `go-mark-scroll-${i}`,
			title: `${i} mark`,
			parentId: goToParentId,
			contexts: ["all"],
			listener: goToScrollMarkListener.bind(null, i - 1),
		});
	}
}

async function addScrollMarkListener(index, info, tab) {
	try {
		addScrollMark(
			tab.id,
			index,
			await browser.tabs.sendMessage(
				tab.id,
				{ getCurrentScroll: true },
				{ frameId: info.frameId },
			),
		);
	} catch (error) {
		console.error(error);
	}
}

async function goToScrollMarkListener(index, info, tab) {
	try {
		await browser.tabs.sendMessage(
			tab.id,
			{ goToScrollMark: marks[tab.id]?.[index] ?? 0 },
			{ frameId: info.frameId },
		);
	} catch (error) {
		console.error(error);
	}
}

function addScrollMark(tabId, index, scroll) {
	if (!marks[tabId]) {
		marks[tabId] = [];
		for (let i = 0; i < maxMarks; ++i) {
			marks[tabId][i] = 0;
		}
	}
	marks[tabId][index] = scroll;
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
		maxMarks = parseInt(await optionsTable.get("maxMarks"));
		if (changes[optionsTable.name]) {
			await resetContextMenus();
		}
	} catch (error) {
		console.error(error);
	}
}
