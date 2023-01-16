(function () {
	'use strict';

	class Table {
		constructor(name="table", database) {
			this.name = name;
			this.database = database;
		}

		async get(key) {
			const table = await this.getAll();
			if (!Array.isArray(key)) {
				return table[key];
			} else {
				const values = [];
				for (const k of key) {
					values.push(table[k]);
				}
				return values;
			}
		}

		async set(key, value) {
			let table = await this.getAll();
			if (value !== undefined) {
				table[key] = value;
			} else {
				if (Array.isArray(table)) {
					if (Array.isArray(key)) {
						table = [...table, ...key];
					} else {
						table = [...table, key];
					}
				} else {
					if (typeof key === "object") {
						table = { ...table, ...key };
					} else {
						table = { ...table, [key]: key };
					}
				}
			}
			return this.database.set(this.name, table);
		}

		async getAll() {
			return await this.database.get(this.name) || {};
		}

		async getKeys() {
			return Object.keys(await this.getAll());
		}

		async remove(key) {
			const table = await this.getAll();
			delete table[key];
			return this.database.set(this.name, table);
		}

		async removeAll() {
			return this.database.remove(this.name);
		}
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function makeUrl({
		templateUrl,
		words,
		textSlot="$",
		spaceReplacement="+",
	}) {
		return templateUrl.replace(
			textSlot,
			words.join(spaceReplacement),
		);
	}

	const browser$1 = chrome;

	var localStorage = {
		async set(key, value) {
			const keys = value !== undefined ? { [key]: value } : key;
			return browser$1.storage.local.set(keys);
		},

		async get(key) {
			const result = await browser$1.storage.local.get(key);
			return isString(key) ? result[key] : result;
		},

		async remove(keys) {
			return browser$1.storage.local.remove(keys);
		},

		async getAll() {
			return browser$1.storage.local.get();
		},
	};

	const database = localStorage;
	const suggestionsTable = new Table("suggestions", database);
	const utilsTable = new Table("utils", database);

	function populateSuggestions(table) {
		return table.set({
			"cpe": {
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/portuguese-english/$",
				textSlot: "$",
				spaceReplacement: "-",
			},
			"cep": {
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/english-portuguese/$",
				textSlot: "$",
				spaceReplacement: "-",
			},
			"ce": {
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/english/$",
				textSlot: "$",
				spaceReplacement: "-",
			},
			"tep": {
				templateUrl: "https://translate.google.com.br/?sl=en&tl=pt&text=$&op=translate",
				textSlot: "$",
				spaceReplacement: " ",
			},
			"tpe": {
				templateUrl: "https://translate.google.com.br/?sl=pt&tl=en&text=$&op=translate",
				textSlot: "$",
				spaceReplacement: " ",
			},
			"id": {
				templateUrl: "https://idioms.thefreedictionary.com/$",
				textSlot: "$",
				spaceReplacement: "-",
			},
			"ox": {
				templateUrl: "https://www.oxfordlearnersdictionaries.com/us/definition/english/$",
				textSlot: "$",
				spaceReplacement: "-",
			},
		});
	}

	const browser = chrome;

	(async () => {
		await utilsTable.set({ textSlot: "$", spaceReplacement: "+" });
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
			const suggestion = buildSuggestion(
				input,
				await utilsTable.get("defaultKeyword"),
				suggestionsObject2array(await suggestionsTable.getAll()),
			);
			return suggest([{
				content: suggestion,
				description: `<url>${suggestion}</url>`,
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

})();
