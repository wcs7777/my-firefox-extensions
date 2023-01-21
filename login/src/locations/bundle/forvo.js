(function () {
	'use strict';

	function $(selectors, target=document) {
		return target.querySelector(selectors);
	}

	function digits() {
		return "0123456789";
	}

	function isNumber(character) {
		return digits().indexOf(character) > -1;
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

	function waitElement({
		selectors,
		target=document.body,
		timeout=10000,
		interval=500,
	}={}) {
		return new Promise((resolve, reject) => {
			const idInterval = setInterval(() => {
				const element = $(selectors, target);
				if (element != undefined) {
					clearTimers();
					resolve(element);
				}
			}, interval);
			const idTimeout = (
				timeout > 0 ?
				setTimeout(() => {
					clearTimers();
					reject(
						new Error(`${timeout} expired without found ${selectors}`),
					);
				}, timeout) :
				false
			);

			function clearTimers() {
				clearInterval(idInterval);
				if (idTimeout !== false) {
					clearTimeout(idTimeout);
				}
			}

		});
	}

	async function waitInputToSetValue(selectors, value) {
		const input = await waitElement({ selectors });
		input.value = value;
		input.dispatchEvent(new Event("input", { bubbles: true }));
	}

	async function waitFormToSubmit(selectors) {
		const form = await waitElement({ selectors });
		return form.submit();
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

	function listenLogin(logins) {
		document.addEventListener("keydown", async (e) => {
			try {
				if (e.altKey && isNumber(e.key)) {
					e.preventDefault();
					const index = Math.max(
						0,
						Math.min(
							parseInt(e.key) - 1,
							logins.length - 1,
						),
					);
					await logins[index]();
				}
			} catch (error) {
				console.error(error);
			}
		});
	}

	(async () => {
		const logins = await optionsTable.get("forvo");
		listenLogin(
			logins.map(({ user, password }) => createLogin(user, password)),
		);
	})()
		.catch(console.error);

	function createLogin(user, password) {
		return async () => {
			await waitInputToSetValue("#login", user);
			await waitInputToSetValue("#password", password);
			await waitFormToSubmit("form[action='/login/']");
		};
	}

})();
