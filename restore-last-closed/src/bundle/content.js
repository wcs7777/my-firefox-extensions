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

	class Table {
		constructor(name="table", database) {
			this.name = name;
			this.database = database;
		}

		async get(key) {
			const table = await this.getAll();
			return !Array.isArray(key) ? table[key] : key.map((k) => table[k]);
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

	(async () => {
		try {
			if (await optionsTable.get("activated")) {
				const shortcut = await optionsTable.get("shortcut");
				document.addEventListener("keydown", async (e) => {
					try {
						if (e.key.toUpperCase() === shortcut) {
							e.preventDefault();
							await browser.runtime.sendMessage({
								restore: true,
							});
						}
					} catch (error) {
						console.error(error);
					}
				});
				await browser.runtime.onMessage.addListener(({ openUrl }) => {
					if (openUrl) {
						window.open(openUrl, "_self");
					}
				});
				if (window.location.href !== "about:blank") {
					window.addEventListener("beforeunload", () => {
						browser.runtime.sendMessage({
							lastClosed: window.location.href,
						})
							.catch(console.error);
					});
				}
			}
		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);

})();
