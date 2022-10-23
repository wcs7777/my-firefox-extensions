import { utilsTable, parentItemTable, itemsTable } from "./tables.js";
import populateParentItem from "./populate-parent-item.js";
import populateItems from "./populate-items.js";
import { makeUrl } from "./utils.js";

const onClickedListeners = [];

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
	onClickedListeners.length = 0;
	const parentId = createParentMenuItem(
		parentItem.accessKey,
		parentItem.title,
	);
	for (const key of Object.keys(items)) {
		const onClicked = createOnClicked(
			createChildMenuItem(
				parentId,
				key,
				items[key].title,
			),
			items[key],
		);
		browser.menus.onClicked.addListener(onClicked);
		onClickedListeners.push(onClicked);
	}
}

function createParentMenuItem(accessKey, title) {
	return browser.menus.create({
		id: accessKey,
		title: `&${accessKey} - ${title}`,
		contexts: ["selection"],
	});
}

function createChildMenuItem(parentId, accessKey, title) {
	return browser.menus.create({
		id: accessKey,
		title: `&${accessKey} - ${title}`,
		contexts: ["selection"],
		parentId,
	});
}

function createOnClicked(id, item) {
	return async (info, tab) => {
		if (info.menuItemId === id) {
			const text = info.selectionText.trim().toLowerCase();
			console.log("-".repeat(60));
			console.log(`searching: ${text}`);
			console.log(`with: ${item.title}`);
			console.log("-".repeat(60));
			try {
				return await (
					(!item.isPopup) ?
					createTab(item, text, tab.index + 1) :
					createPopup(item, text)
				)
			} catch (error) {
				console.error(error);
			}
		}
	};
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
