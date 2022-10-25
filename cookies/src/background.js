import { url2domain } from "./utils.js";
import onClickedListener from "./on-clicked-listener.js";

(async () => {
	await setMenu();
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function setMenu() {
	await browser.menus.removeAll();
	const itemId = browser.menus.create({
		id: "Cookies",
		title: "Cookies",
		contexts: ["all"],
	});
	onClickedListener.add(async (info, tab) => {
		if (info.menuItemId === itemId) {
			try {
				await removeAllCookies();
			} catch (error) {
				console.error(error);
			}
		}
	});
}

async function getCookiesGroupedByUrl() {
	const cookies = {};
	for (const url of await getAllUrls()) {
		cookies[url] = await getCookiesByUrl(url);
	}
	return cookies;
}

function getCookiesByUrl(url) {
	return browser.cookies.getAll({ url });
}

async function removeAllCookies() {
	for (const url of await getAllUrls()) {
		removeCookiesByUrl(url)
			.then(() => {
				console.log(`All cookies removed in ${url}`);
			})
			.catch((error) => {
				console.error(`Error removing cookies in ${url}`);
				console.error(error);
			});
	}
}

async function removeCookiesByUrl(url) {
	for (const { name } of await getCookiesByUrl(url)) {
		browser.cookies.remove({ url, name })
			.then(() => {
				console.log(`${name} removed in ${url}`);
			})
			.catch((error) => {
				console.error(`Error removing ${name} in ${url}`);
				console.error(error);
			});
	}
}

async function getCookiesGroupedByDomain() {
	const cookies = {};
	for (const domain of await getAllDomains()) {
		cookies[domain] = await getCookiesByDomain(domain);
	}
	return cookies;
}

function getCookiesByDomain(domain) {
	return browser.cookies.getAll({ domain });
}

async function getAllDomains() {
	const domains = new Set();
	for (const url of await getAllUrls()) {
		domains.add(url2domain(url));
	}
	return Array.from(domains);
}

async function getAllUrls() {
	const tabs =  await browser.tabs.query({ currentWindow: true });
	return tabs
		.map((tab) => tab.url)
		.filter((url) => url !== undefined);
}
