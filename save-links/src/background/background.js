import downloadObject from "../utils/download-object.js";
import populateOptions from "../utils/populate-options.js";
import { optionsTable, utilsTable } from "../utils/tables.js";
import { isString } from "../utils/utils.js";

const links = {};
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

function createContextMenus(parentAccessKey) {
	const parentId = createContextMenu({
		id: "save-links",
		title: `&${parentAccessKey} - Save Links`,
		contexts: ["all"],
	});
	[
		{
			id: "toggle-link",
			title: "&Toggle Link",
			contexts: ["link"],
			listener: toggleLink,
		},
		{
			id: "open-links",
			title: "&Open Links",
			contexts: ["all"],
			listener: openLinks,
		},
		{
			id: "download-links",
			title: "&Download Links",
			contexts: ["all"],
			listener: downloadLinks,
		},
	]
		.forEach((createProperties) => {
			createContextMenu({
				parentId,
				...createProperties,
			});
		});
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

async function toggleLink(info, { id: tabId }) {
	try {
		let color = "";
		if (links[tabId] == null) {
			links[tabId] = new Set();
		}
		if (!links[tabId].has(info.linkUrl)) {
			links[tabId].add(info.linkUrl);
			color = await optionsTable.get("selectedColor");
		} else {
			links[tabId].delete(info.linkUrl);
		}
		await setInjectedScriptVariables(
			{ color, link: info.linkUrl },
			tabId,
			info.frameId,
		);
		await injectScript(tabId, {
			frameId: info.frameId,
			file: "/src/content/change-link-color-bundle.js",
		});
	} catch (error) {
		console.error(error);
	}
}

async function openLinks(info, tab) {
	try {
		if (links[tab.id]) {
			const tabLinks = Array.from(links[tab.id].values());
			const reverseOrder = await optionsTable.get("reverseOrder");
			console.log({ reverseOrder });
			for (const link of reverseOrder ? tabLinks.reverse() : tabLinks) {
				await browser.tabs.create({
					url: link,
					index: tab.index + 1,
				});
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function downloadLinks(info, tab) {
	try {
		if (links[tab.id]) {
			await downloadObject(
				{ [tab.title]: Array.from(links[tab.id].values()) },
				`links-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.txt`,
			);
		}
	} catch (error) {
		console.error(error);
	}
}

function setInjectedScriptVariables(obj, tabId, frameId=0) {
	const variables = Object
		.entries(obj)
		.map(([name, value]) => {
			return (
				isString(value) ?
				`${name} = "${value}"` :
				`${name} = ${value}`
			);
		});
	if (variables.length > 0) {
		return injectScript(
			tabId,
			{
				frameId,
				code: `var ${variables.join(", ")};`
			},
		);
	}
}

function injectScript(tabId, details) {
	return browser.tabs.executeScript(tabId, details);
}

function onContextMenuClicked(info, tab) {
	contextMenusListeners[info.menuItemId]?.(info, tab);
}

function onRemovedTab(tabId) {
	links[tabId] = null;
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
