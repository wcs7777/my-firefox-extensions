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

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	function waitForElement(selectors, interval, timeout) {
		const slc = !Array.isArray(selectors) ? [selectors] : selectors;
		return new Promise((resolve, reject) => {
			const intervalID = setInterval(() => {
				const element = slc.find((s) => $(s));
				if (element) {
					clearInterval(intervalID);
					resolve(element);
				}
			}, interval);
			setTimeout(() => {
				clearInterval(intervalID);
				reject();
			}, timeout);
		});
	}

	function onLocationChange(listener) {
		onLocationChange.current = (
			onLocationChange.current || document.location.href
		);
		const observer = new MutationObserver(async () => {
			if (onLocationChange.current !== document.location.href) {
				onLocationChange.current = document.location.href;
				if (listener.constructor.name === "AsyncFunction") {
					await listener();
				} else {
					listener();
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		return observer;
	}

	function isString(value) {
	  return Object.prototype.toString.call(value) === "[object String]"
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
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
			const shortcut = await optionsTable.get("shortcut");
			onLocationChange(() => main(shortcut));
			await main(shortcut);
		} catch (error) {
			console.error(error);
		}
	})()
		.catch(console.error);

	async function main(shortcut) {
		await waitForElement("video", 250, 8000);
		document.addEventListener("keydown", async (e) => {
			try {
				if (e.key === shortcut) {
					e.preventDefault();
					await chooseHighestQuality();
				}
			} catch (error) {
				console.error(error);
			}
		});
	}

	function chooseHighestQuality() {
		return setQuality("Highest");
	}

	async function setQuality(quality) {
		const ms = 600;
		const settingsButton = $(".ytp-settings-button");
		settingsButton.click();
		await sleep(ms);
		$(".ytp-panel-menu").lastChild.click();
		await sleep(ms);
		const qualityOptions = $$(".ytp-menuitem");
		const selection = (
			quality === "Highest" ?
			qualityOptions[0] :
			qualityOptions.find((option) => option.innerText === quality)
		);
		if (selection) {
			if (selection.attributes["aria-checked"] === undefined) {
				selection.click();
			}
		} else {
			const qualityTexts = qualityOptions
				.map((option) => option.innerText)
				.join("\n");
			console.log(`"${quality} not found. Options are:`);
			console.log(`Highest\n${qualityTexts}`);
		}
		settingsButton.click();
	}

})();
