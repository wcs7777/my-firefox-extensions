(function () {
	'use strict';

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function tag(tagName) {
		return document.createElement(tagName);
	}

	function textNode(data) {
		return document.createTextNode(data);
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

	const attribute = "data-addon-highlight-selection";

	(async () => {
		try {
			const {
				shortcut,
				shortcutHighlights,
				color,
				backgroundColor,
				underline,
				activated,
			} = await optionsTable.getAll();
			if (activated) {
				const style = makeStyle(color, backgroundColor, underline);
				document.addEventListener("keydown", (e) => {
					const key = e.key.toUpperCase();
					if (key === shortcut) {
						e.preventDefault();
						highlighSelection(style);
					} else if (key === shortcutHighlights) {
						e.preventDefault();
						console.clear();
						console.log(highlights().join("\n"));
					}
				});
			}
		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);

	function makeStyle(color, backgroundColor, underline) {
		const clr = color ? `color: ${color};` : "";
		const bc = backgroundColor ? `background-color: ${backgroundColor};` : "";
		const td = underline ? "text-decoration: underline;" : "";
		return clr + bc + td;
	}

	function highlighSelection(style) {
		const selection = window.getSelection();
		for (let i = 0; i < selection.rangeCount; ++i) {
			const range = selection.getRangeAt(i);
			const text = range.toString();
			range.deleteContents();
			range.insertNode(createHightlight(text, style));
		}
		selection.removeAllRanges();
	}

	function highlights() {
		return $$(`[${attribute}="true"]`).map((h) => h.textContent);
	}

	function createHightlight(text, style) {
		const span = tag("span");
		span.style.cssText = style;
		span.setAttribute(attribute, true);
		span.appendChild(textNode(text));
		return span;
	}

})();
