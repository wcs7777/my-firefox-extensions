(function () {
	'use strict';

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function tag(tagName, { id, className, children }={}) {
		const element = document.createElement(tagName);
		if (id) {
			element.id = id;
		}
		if (className) {
			element.className = className;
		}
		if (children) {
			element.appendChild(fragment([...toArray(children)]));
		}
		return element;
	}

	function fragment(children) {
		const documentFragment = document.createDocumentFragment();
		for (const child of children) {
			documentFragment.appendChild(
				!isString(child) ? child : textNode(child),
			);
		}
		return documentFragment;
	}

	function textNode(data) {
		return document.createTextNode(data);
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

	function toObject(value) {
		return typeof value === "object" ? value : { [value]: value };
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
				color,
				backgroundColor,
				underline,
				activated,
			} = await optionsTable.getAll();
			if (activated) {
				const style = makeStyle(color, backgroundColor, underline);
				document.addEventListener("keydown", (e) => {
					if (e.key.toUpperCase() === shortcut && hasSelection()) {
						e.preventDefault();
						highlighSelection(style);
					}
				});
				if (!browser.runtime.onMessage.hasListener(onMessage)) {
					browser.runtime.onMessage.addListener(onMessage);
				}
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
			range.insertNode(createHighlight(text, style));
		}
		selection.removeAllRanges();
	}

	function hasSelection() {
		return window.getSelection().toString().trim().length > 0;
	}

	function highlights() {
		return $$(`[${attribute}="true"]`).map((h) => h.textContent);
	}

	function createHighlight(text, style) {
		const span = tag("span");
		span.style.cssText = style;
		span.setAttribute(attribute, true);
		span.appendChild(textNode(text));
		return span;
	}

	function onMessage({ getData }, sender, sendResponse) {
		if (getData) {
			sendResponse({
				title: document.title,
				highlights: highlights(),
			});
		}
	}

})();
