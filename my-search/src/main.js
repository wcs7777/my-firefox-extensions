import { utilsTable, suggestionsTable } from "./tables.js";
import populateSuggestions from "./populate-items.js";
import { makeUrl } from "./utils.js";

(async () => {
	await utilsTable.set({ textSlot: "$", spaceReplacement: "+" })
	if (!await utilsTable.get(suggestionsTable.name)) {
		await populateSuggestions(suggestionsTable);
		await utilsTable.set(suggestionsTable.name, true);
	}
	if (!await utilsTable.get("defaultKeyword")) {
		await utilsTable.set(
			"defaultKeyword",
			(await suggestionsTable.getKeys())[0],
		);
	}
	if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
		browser.storage.onChanged.addListener(storageOnChanged);
	}
	if (!browser.omnibox.onInputChanged.hasListener(onInputChangedListener)) {
		browser.omnibox.onInputChanged.addListener(onInputChangedListener);
	}
	if (!browser.omnibox.onInputEntered.hasListener(onInputEnteredListener)) {
		browser.omnibox.onInputEntered.addListener(onInputEnteredListener);
	}
	setDefaultSuggestion(
		await utilsTable.get("defaultKeyword"),
		await suggestionsTable.getKeys(),
	);
})()
	.then(() => console.log("Initialization finished"))
	.catch(console.error);

async function storageOnChanged(changes) {
	try {
		if (changes[suggestionsTable.name] || changes[utilsTable.name]) {
			setDefaultSuggestion(
				await utilsTable.get("defaultKeyword"),
				await suggestionsTable.getKeys(),
			);
		}
	} catch (error) {
		console.error(error);
	}
}

function setDefaultSuggestion(defaultKeyword, keywords) {
	browser.omnibox.setDefaultSuggestion({
		description: [
			`(${defaultKeyword})`,
			...keywords.filter((keyword) => keyword !== defaultKeyword),
		].join(", "),
	});
}

async function onInputChangedListener(input, suggest) {
	try {
		return suggest([{
			content: buildSuggestion(
				input,
				await utilsTable.get("defaultKeyword"),
				suggestionsObject2array(await suggestionsTable.getAll()),
			),
		}]);
	} catch (error) {
		console.error(error);
	}
}

async function onInputEnteredListener(input, disposition) {
	try {
		const url = (
			/^https?:\/\//.test(input) ?
			input :
			buildSuggestion(
				input,
				await utilsTable.get("defaultKeyword"),
				suggestionsObject2array(await suggestionsTable.getAll()),
			)
		);
		return {
			"currentTab": () => browser.tabs.update({ url }),
			"newForegroundTab": () => browser.tabs.create({ url }),
			"newBackgroundTab": () => browser.tabs.create({ url, active: false }),
		}[disposition]();
	} catch (error) {
		console.error(error);
	}
}

function buildSuggestion(input, defaultKeyword, suggestions) {
	const parts = input.trim().split(/\s+/);
	const [first, ...remaining] = parts;
	const keywordSuggestion = suggestions.find((s) => s.keyword === first);
	if (keywordSuggestion) {
		return makeUrl({ ...keywordSuggestion, words: remaining });
	} else {
		return makeUrl({
			...suggestions.find((s) => s.keyword === defaultKeyword),
			words: parts,
		});
	}
}

function suggestionsObject2array(suggestions) {
	return Object
		.keys(suggestions)
		.map((key) => { return { ...suggestions[key], keyword: key } });
}
