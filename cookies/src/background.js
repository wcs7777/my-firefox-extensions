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

(async () => {
	await setMenuItems();
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
					url: "all-cookies.html",
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
					url: "current-page-cookies.html",
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
					url: "remove-all-cookies.html",
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
					url: "current-page-cookies-removed.html",
				});
			} catch (error) {
				console.error(error);
			}
		}
	});
	return id;
}
