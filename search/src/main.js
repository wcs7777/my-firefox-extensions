import { utilsTable, parentItemTable, itemsTable } from "./tables.js";
import populateParentItem from "./populate-parent-item.js";
import populateItems from "./populate-items.js";
import { makeUrl } from "./utils.js";

(async () => {
	await utilsTable.set({ textSlot: "$", spaceReplacement: "+" });
	await populate(parentItemTable, populateParentItem)
		.then(console.log)
		.catch(console.error);
	await populate(itemsTable, populateItems)
		.then(console.log)
		.catch(console.error);
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
	}
	await setMenus(
		await parentItemTable.getAll(),
		await itemsTable.getAll(),
	);
})()
	.then(() => console.log("Initialization finished"))
	.catch(console.error);

async function populate(table, populateFn) {
	try {
		if (!await utilsTable.get(table.name)) {
			await populateFn(table);
			await utilsTable.set(table.name, true);
			return `${table.name} populated`;
		}
	} catch (error) {
		throw new Error(`Error populating ${table.name}`, error);
	}
}

async function storageOnChanged(changes) {
	try {
		if (changes[parentItemTable.name] || changes[itemsTable.name]) {
			await setMenus(
				await parentItemTable.getAll(),
				await itemsTable.getAll(),
			);
		}
	} catch (error) {
		console.error(error);
	}
}

async function setMenus(parentItem, items) {
	await browser.menus.removeAll();
	const parentId = browser.menus.create({
		id: parentItem.accessKey,
		title: `&${parentItem.accessKey} - ${parentItem.title}`,
		contexts: ["selection"],
	});
	for (const key of Object.keys(items)) {
		const item = items[key];
		browser.menus.create({
			id: key,
			title: `&${key} - ${item.title}`,
			contexts: ["selection"],
			parentId,
			onclick: async (info, tab) => {
				const text = info.selectionText.trim().toLowerCase();
				try {
					return await (
						(!item.isPopup) ?
						createTab(item, text, tab.index + 1) :
						createPopup(item, text)
					)
				} catch (error) {
					console.error(error);
				}
			},
		});
	}
}

function createTab(item, text, index) {
	return browser.tabs.create({
		url: makeUrl({ ...item, text }),
		index,
	});
}

function createPopup(item, text) {
	return browser.windows.create({
		allowScriptsToClose: true,
		url: makeUrl({ ...item, text }),
		type: "popup",
	});
}
