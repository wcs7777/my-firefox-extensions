import Addon from './addon.js';

const addon = new Addon();
addon.syncStorage().catch(console.error);

if (!browser.omnibox.onInputChanged.hasListener(inputChangedCB)) {
	browser.omnibox.onInputChanged.addListener(inputChangedCB);
}
if (!browser.omnibox.onInputEntered.hasListener(inputEnteredCB)) {
	browser.omnibox.onInputEntered.addListener(inputEnteredCB);
}
if (!browser.storage.onChanged.hasListener(storageChangedCB)) {
	browser.storage.onChanged.addListener(storageChangedCB);
}
if (!browser.runtime.onInstalled.hasListener(installedCB)) {
	browser.runtime.onInstalled.addListener(installedCB);
}

/**
 * @param {string} input
 * @param {(suggestResults: browser.omnibox.SuggestResult[]) => void} suggest
 */
async function inputChangedCB(input, suggest) {
	try {
		const {
			suggestion: content,
			shortcut: description,
		} = await addon.buildSuggestion(input);
		/** @type {browser.omnibox.SuggestResult} */
		const suggestionResult = {
			content,
			deletable: false,
			description,
		};
		suggest([suggestionResult]);
	} catch (error) {
		console.error(error);
	}
}

/**
 * @param {string} text
 * @param {browser.omnibox.OnInputEnteredDisposition} disposition
 */
async function inputEnteredCB(text, disposition) {
	try {
		let url = text;
		if (!/^https?:\/\//.test(text)) {
			const { suggestion } = await addon.buildSuggestion(text);
			url = suggestion;
		}
		const active = false;
		const action = {
			[disposition]: () => Promise.reject(
				`Invalid disposition: ${disposition}`,
			),
			'currentTab': () => browser.tabs.update({ url }),
			'newForegroundTab': () => browser.tabs.create({ url }),
			'newBackgroundTab': () => browser.tabs.create({ url, active }),
		};
		await Promise.all([action[disposition](), addon.updateLastSearch()]);
	} catch (error) {
		console.error(error);
	}
}

/**
 * @param {{ [key: string]: browser.storage.StorageChange }} _changes
 * @param {string} areaName
 * @returns {void}
 */
function storageChangedCB(_changes, areaName) {
	if (areaName !== 'local') {
		return;
	}
	addon.syncStorage().catch(console.error);
}

/**
 * @param {browser.runtime._OnInstalledDetails} details
 * @returns {Promise<void>}
 */
async function installedCB(details) {
	if (details.temporary) {
		console.clear();
		console.log("Cleaning storage due to temporary installation");
		await browser.storage.local.clear();
	}
}
