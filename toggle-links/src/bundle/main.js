(function () {
	'use strict';

	function tag(tagName) {
		return document.createElement(tagName);
	}

	function textNode(data) {
		return document.createTextNode(data);
	}

	function createStyle(data) {
		const style = tag("style");
		style.appendChild(textNode(data));
		return style;
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

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

	var localStorage = {
		async set(key, value) {
			const keys = value !== undefined ? { [key]: value } : key;
			return browser.storage.local.set(keys);
		},

		async get(key) {
			const result = await browser.storage.local.get(key);
			return isString(key) ? result[key] : result;
		},

		async remove(keys) {
			return browser.storage.local.remove(keys);
		},

		async getAll() {
			return browser.storage.local.get();
		},
	};

	const database = localStorage;
	const optionsTable = new Table("options", database);
	new Table("utils", database);
	const websitesTable = new Table("websites", database);

	const style = createStyle("a, span { pointer-events: none !important; }");

	(async () => {
		try {
			if (await optionsTable.get("activated")) {
				if (autoDisable(await websitesTable.getKeys(), window.location.href)) {
					console.log(disableLinks());
				}
				const shortcut = await optionsTable.get("shortcut");
				console.log(`Toggle links with Alt+${shortcut}`);
				document.addEventListener("keydown", (e) => {
					if (e.altKey && e.key.toUpperCase() === shortcut) {
						e.preventDefault();
						console.log(toggleLinks());
					}
				});
			}
		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);

	function autoDisable(websitesList, href) {
		return websitesList.find((website) => href.startsWith(website));
	}

	function toggleLinks() {
		return document.head.contains(style) ? enableLinks() : disableLinks();
	}

	function enableLinks() {
		style.remove();
		return "links enabled";
	}

	function disableLinks() {
		enableLinks();
		document.head.appendChild(style);
		return "links disabled";
	}

})();
