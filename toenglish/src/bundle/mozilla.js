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

	async function commonLogic(listener) {
		try {
			const { shortcut, activated } = await optionsTable.getAll();
			if (activated) {
				document.addEventListener("keydown", (e) => {
					if (e.key === shortcut) {
						listener();
					}
				});
			}
		} catch (error) {
			console.error(error);
		}
	}

	commonLogic(() => {
		if (window.location.href.includes("pt-BR")) {
			window.open(
				window.location.href.replace("pt-BR", "en-US"),
				"_self",
			);
		}
	})
		.catch(console.error);

})();
