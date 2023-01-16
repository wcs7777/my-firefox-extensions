(function () {
	'use strict';

	function populateOptions(table) {
		return table.set({
			shortcut: "F3",
			activated: true,
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
	const optionsTable = new Table("options", database);
	const utilsTable = new Table("utils", database);

	const browser = chrome;

	(async () => {
		if (!browser.runtime.onMessage.hasListener(onMessageListener)) {
			browser.runtime.onMessage.addListener(onMessageListener);
		}
		if (!await utilsTable.get(optionsTable.name)) {
			await populateOptions(optionsTable);
			await utilsTable.set(optionsTable.name, true);
		}
		if (!browser.action.onClicked.hasListener(actionOnClicked)) {
			browser.action.onClicked.addListener(actionOnClicked);
		}
		return "Initialization finished";
	})()
		.then(console.log)
		.catch(console.error);

	async function onMessageListener(message, sender) {
		try {
			if (message?.restore === true) {
				await restoreLastClosed(sender.tab.id);
			} else if (message?.lastClosed) {
				await utilsTable.set("lastClosed", message.lastClosed);
				return { saved: true };
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function actionOnClicked(tab) {
		try {
			await restoreLastClosed(tab.id);
		} catch (error) {
			console.error(error);
		}
	}

	async function restoreLastClosed(tabId) {
		const last = await getLastClosed();
		if (last?.tab.sessionId) {
			await browser.sessions.restore(last.tab.sessionId);
		} else {
			await browser.tabs.sendMessage(
				tabId,
				{ openUrl: await utilsTable.get("lastClosed") },
			);
		}
	}

	async function getLastClosed() {
		const closed = await browser.sessions.getRecentlyClosed({
			maxResults: 1,
		});
		return closed?.[0];
	}

})();
