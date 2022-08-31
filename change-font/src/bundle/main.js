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

	(async () => {
		try {
			const {
				shortcut,
				fontFamily,
				fontSize,
				lineHeight,
				activated,
			} = await optionsTable.getAll();
			if (activated) {
				const style = createStyle(`
				body, main, p {
					font: ${fontSize}/${lineHeight} "${fontFamily}" !important;
				}
			`);
				if (autoEnable(await websitesTable.getKeys(), window.location.href)) {
					console.log(enableCustomFont(style));
				}
				console.log(`Toggle custom font with Ctrl+${shortcut}`);
				document.addEventListener("keydown", (e) => {
					if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
						e.preventDefault();
						console.log(toggleCustomFont(style));
					}
				});
			}
		} catch (error) {
			console.error(error);
		}

		function autoEnable(websitesList, href) {
			return websitesList.find((website) => href.startsWith(website));
		}

		function toggleCustomFont(style) {
			return (
				document.head.contains(style) ?
				disableCustomFont(style) :
				enableCustomFont(style)
			);
		}

		function disableCustomFont(style) {
			style.remove();
			return "custom font disabled";
		}

		function enableCustomFont(style) {
			disableCustomFont(style);
			document.head.appendChild(style);
			return "custom font enabled";
		}
	})()
		.catch(console.error);

})();
