import { fragment, tag } from "./utils.js";

export async function getCookiesGroupedByUrl() {
	const list = [];
	for (const url of await getAllUrls()) {
		list.push({
			url,
			cookies: await getCookiesByUrl(url),
		});
	}
	return list;
}

export function getCookiesByUrl(url) {
	return browser.cookies.getAll({ url });
}

export async function removeAllCookies() {
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

export async function removeCookiesByUrl(url) {
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

export async function getAllUrls() {
	const tabs =  await browser.tabs.query({ currentWindow: true });
	return tabs
		.map((tab) => tab.url)
		.filter((url) => url !== undefined);
}

export function cookiesGroupedByUrlItemTag({ url, cookies }) {
	return tag("div", {
		children: [
			tag("h2", { children: url }),
			cookiesTag(cookies),
		],
	});
}

export function cookiesTag(cookies) {
	return tag("ul", {
		children: cookies.map((cookie) => {
			return tag("li", {
				children: tag("ul", {
					children: Object.entries(cookie).map(([key, value]) => {
						return tag("li", { children: itemFragment(key, value) });
					}),
				}),
			});
		}),
	});
}

export function itemFragment(key, value) {
	return fragment([
		tag("strong", { children: `${key}: ` }),
		value?.toString() ?? "",
	]);
}
