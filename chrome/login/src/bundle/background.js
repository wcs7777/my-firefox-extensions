(function () {
	'use strict';

	function populateOptions(table) {
		return table.set({
			"forvo": [
				{
					user: "user",
					password: "password",
				},
			],
			"gmail": [
				{
					user: "user",
					password: "password",
				},
			],
			"microsoft": [
				{
					user: "user",
					password: "password",
				},
			],
			"github": [
				{
					user: "user",
					password: "password",
				},
			],
			"siga": [
				{
					user: "user",
					password: "password",
				},
			],
			"linkedin": [
				{
					user: "user",
					password: "password",
				},
			],
		});
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

	const browser = chrome;

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
	const utilsTable = new Table("utils", database);

	(async () => {
		await populate(optionsTable, populateOptions);
		return "Initialization finished";
	})()
		.then(console.log)
		.catch(console.error);

	async function populate(table, fn) {
		if (!await utilsTable.get(table.name)) {
			await fn(table);
			await utilsTable.set(table.name, true);
		}
		return `${table.name} populated`;
	}

})();
