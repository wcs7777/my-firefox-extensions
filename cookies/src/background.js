import {
	getCookiesGroupedByUrl,
	getCookiesByUrl,
	removeAllCookies,
	removeCookiesByUrl,
} from "./cookies.js";
import {
	createChildMenuItem,
	createParentMenuItem,
	onClickedListeners,
} from "./menu-items.js";
import { websitesTable } from "./tables.js";

const cleanSites = {};

(async () => {
	await setMenuItems();
	await setTabOnUpdatedListener();
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
	}
	if (!browser.tabs.onRemoved.hasListener(tabOnRemoved)) {
		browser.tabs.onRemoved.addListener(tabOnRemoved);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function setMenuItems() {
	await browser.menus.removeAll();
	onClickedListeners.removeAll();
	const parentId = createParentMenuItem("cookies", "Cookies");
	createViewAllCookiesMenuItem(parentId);
	createViewCurrentPageCookiesMenuItem(parentId);
	createRemoveAllCookiesMenuItem(parentId);
	createRemoveCurrentPageCookiesMenuItem(parentId);
}

async function setTabOnUpdatedListener() {
	try {
		const urls =  await websitesTable.getKeys();
		browser.tabs.onUpdated.removeListener(tabOnUpdated);
		if (urls.length > 0) {
			browser.tabs.onUpdated.addListener(
				tabOnUpdated,
				{
					properties: ["url"],
					urls,
				}
			);
		}
	} catch (error) {
		console.error(error);
	}
}

function tabOnUpdated(tabId, changeInfo, tab) {
	cleanSites[tabId.toString()] = tab.url;
}


async function storageOnChanged(changes) {
	try {
		if (changes[websitesTable.name]) {
			await setTabOnUpdatedListener();
		}
	} catch (error) {
		console.error(error);
	}
}

async function tabOnRemoved(tabId) {
	try {
		const id = tabId.toString();
		const url = cleanSites[id];
		if (url) {
			delete cleanSites[id];
			await removeCookiesByUrl(url);
		}
	} catch (error) {
		console.error(error);
	}
}

function createViewAllCookiesMenuItem(parentId) {
	const id = createChildMenuItem("view-all", "View All Cookies", parentId);
	onClickedListeners.add(async (info) => {
		if (info.menuItemId === id) {
			try {
				const cookiesGroupedByUrl = await getCookiesGroupedByUrl();
				const onMessage = async (message) => {
					if (message.getCookiesGroupedByUrl) {
						browser.runtime.onMessage.removeListener(onMessage);
						return cookiesGroupedByUrl;
					}
				};
				browser.runtime.onMessage.addListener(onMessage);
				await browser.windows.create({
					url: "pages/all-cookies.html",
				});
			} catch (error) {
				console.error(error);
			}
		}
	});
	return id;
}

function createViewCurrentPageCookiesMenuItem(parentId) {
	const id = createChildMenuItem(
		"current-page-cookies",
		"Current Page Cookies",
		parentId,
	);
	onClickedListeners.add(async (info, tab) => {
		if (info.menuItemId === id) {
			try {
				const cookies = await getCookiesByUrl(tab.url);
				const onMessage = async (message) => {
					if (message.currentPageCookies) {
						browser.runtime.onMessage.removeListener(onMessage);
						return { url: tab.url, cookies };
					}
				};
				browser.runtime.onMessage.addListener(onMessage);
				await browser.windows.create({
					url: "pages/current-page-cookies.html",
				});
			} catch (error) {
				consol.error(error);
			}
		}
	});
	return id;
}

function createRemoveAllCookiesMenuItem(parentId) {
	const id = createChildMenuItem(
		"remove-all-cookies",
		"Remove All Cookies",
		parentId,
	);
	onClickedListeners.add(async (info) => {
		if (info.menuItemId === id) {
			try {
				await removeAllCookies();
				await browser.windows.create({
					url: "pages/remove-all-cookies.html",
				});
			} catch (error) {
				console.error(error);
			}
		}
	});
	return id;
}

function createRemoveCurrentPageCookiesMenuItem(parentId) {
	const id = createChildMenuItem(
		"remove-current-page-cookies",
		"Remove Current Page Cookies",
		parentId,
	);
	onClickedListeners.add(async (info, tab) => {
		if (info.menuItemId === id) {
			try {
				await removeCookiesByUrl(tab.url);
				const onMessage = async (message) => {
					if (message.currentPageCookiesRemoved) {
						browser.runtime.onMessage.removeListener(onMessage);
						return tab.url;
					}
				};
				browser.runtime.onMessage.addListener(onMessage);
				await browser.windows.create({
					url: "pages/current-page-cookies-removed.html",
				});
			} catch (error) {
				console.error(error);
			}
		}
	});
	return id;
}
