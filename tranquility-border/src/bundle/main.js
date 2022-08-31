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

	function $(selectors, target=document) {
		return target.querySelector(selectors);
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
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

	(async () => {
		try {
			const {
				lightColor,
				lightShortcut,
				darkColor,
				darkShortcut,
				boxShadow,
			} = await optionsTable.getAll();
			document.addEventListener("keydown", (e) => {
				if ([lightShortcut, darkShortcut].includes(e.key)) {
					const tranquility = $("#tranquility_container");
					if (tranquility) {
						e.preventDefault();
						document.body.style.backgroundColor = (
							lightShortcut === e.key ? lightColor : darkColor
						);
						tranquility.style.boxShadow = boxShadow;
						removeElements([
							"#tranquility_quick_tools_div",
							"#tranquility_expand_menu_btn",
							"#tranquility_page_up_div",
							"#tranquility_page_down_div",
						]);
					}
				}
			});
		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);


	function removeElements(selectors) {
		for (const selector of selectors) {
			const element = $(selector);
			if (element) {
				element.remove();
			}
		}
	}

})();
