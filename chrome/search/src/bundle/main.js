(function () {
	'use strict';

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

	function toObject(value) {
		return typeof value === "object" ? value : { [value]: value };
	}

	function makeUrl({
		templateUrl,
		text,
		textSlot="$",
		spaceReplacement="+",
	}) {
		return templateUrl
			.replace(
				textSlot,
				text
					.trim()
					.replace(/\s+/g, spaceReplacement),
			);
	}

	class Table {
		constructor(name="table", database) {
			this.name = name;
			this.database = database;
		}

		async get(key) {
			const table = await this.getAll();
			return (
				!Array.isArray(key) ?
				table[key] :
				key.reduce((obj, k) => {
					return { ...obj, [k]: table[k] };
				}, {})
			);
		}

		async set(key, value) {
			let table = await this.getAll();
			if (value !== undefined) {
				table[key] = value;
			} else {
				if (Array.isArray(table)) {
					table = [...table, ...toArray(key)];
				} else {
					table = { ...table, ...toObject(key) };
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

		async remove(keys) {
			const table = await this.getAll();
			for (const key of toArray(keys)) {
				delete table[key];
			}
			return this.database.set(this.name, table);
		}

		async removeAll() {
			return this.database.remove(this.name);
		}
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
	const parentItemTable = new Table("parentItem", database);
	const itemsTable = new Table("items", database);
	const utilsTable = new Table("utils", database);

	function populateParentItem(table) {
		return table.set({
			accessKey: "A",
			title: "Search with",
		});
	}

	function populateItems(table) {
		return table.set({
			"1": {
				title: "Idioms",
				templateUrl: "https://idioms.thefreedictionary.com/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"2": {
				title: "Longman",
				templateUrl: "https://www.ldoceonline.com/dictionary/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"3": {
				title: "Merrian",
				templateUrl: "https://www.merriam-webster.com/dictionary/$",
				textSlot: "$",
				spaceReplacement: " ",
				isPopup: false,
			},
			"4": {
				title: "Urban",
				templateUrl: "https://www.urbandictionary.com/define.php?term=$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"C": {
				title: "Cambridge",
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/english/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"X": {
				title: "Cambridge Popup",
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/english/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: true,
			},
			"Z": {
				title: "PT Cambridge",
				templateUrl: "https://dictionary.cambridge.org/us/dictionary/english-portuguese/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"S": {
				title: "Collins",
				templateUrl: "https://www.collinsdictionary.com/dictionary/english/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"G": {
				title: "Youglish",
				templateUrl: "https://youglish.com/pronounce/$/english/us?",
				textSlot: "$",
				spaceReplacement: " ",
				isPopup: false,
			},
			"F": {
				title: "Free",
				templateUrl: "https://www.thefreedictionary.com/$",
				textSlot: "$",
				spaceReplacement: "+",
				isPopup: false,
			},
			"T": {
				title: "Translate",
				templateUrl: "https://translate.google.com.br/?sl=en&tl=pt&text=$&op=translate",
				textSlot: "$",
				spaceReplacement: " ",
				isPopup: false,
			},
			"D": {
				title: "Linguee",
				templateUrl: "https://www.linguee.com.br/ingles-portugues/traducao/$.html",
				textSlot: "$",
				spaceReplacement: "+",
				isPopup: false,
			},
			"R": {
				title: "Oxford",
				templateUrl: "https://www.oxfordlearnersdictionaries.com/us/definition/english/$",
				textSlot: "$",
				spaceReplacement: "-",
				isPopup: false,
			},
			"H": {
				title: "Thesaurus",
				templateUrl: "https://www.merriam-webster.com/thesaurus/$",
				textSlot: "$",
				spaceReplacement: " ",
				isPopup: false,
			},
		});
	}

	const browser = chrome;

	const onClickedListeners = {
		list: [],

		add(listener) {
			this.list.push(listener);
			browser.contextMenus.onClicked.addListener(listener);
		},

		removeAll() {
			while (this.list.length > 0) {
				browser.contextMenus.onClicked.removeListener(this.list.pop());
			}
		},
	};

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
		await browser.contextMenus.removeAll();
		onClickedListeners.removeAll();
		const parentId = createParentMenuItem(
			parentItem.accessKey,
			parentItem.title,
		);
		for (const key of Object.keys(items)) {
			onClickedListeners.add(
				createOnClicked(
					createChildMenuItem(
						parentId,
						key,
						items[key].title,
					),
					items[key],
				),
			);
		}
	}

	function createParentMenuItem(accessKey, title) {
		return browser.contextMenus.create({
			id: accessKey,
			title: `&${accessKey} - ${title}`,
			contexts: ["selection"],
		});
	}

	function createChildMenuItem(parentId, accessKey, title) {
		return browser.contextMenus.create({
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

})();
