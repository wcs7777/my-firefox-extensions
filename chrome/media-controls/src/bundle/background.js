(function () {
	'use strict';

	function populateControls(table) {
		return table.set({
			begin: ["0", "F2", "Home"],
			end: ["9", "End"],
			middle: ["1", "2", "3", "4", "5", "6", "7", "8"],
			backward: ["ArrowLeft", "MediaTrackPrevious"],
			forward: ["ArrowRight", "MediaTrackNext"],
			togglePlay: ["k", "K", "F1", "Enter"],
			increaseSpeed: ["["],
			decreaseSpeed: ["]"],
			resetSpeed: ["Dead"],
			increaseVolume: ["="],
			decreaseVolume: ["-"],
			toggleMute: ["m", "M"],
		});
	}

	function populateOptions(table) {
		return table.set({
			shortcut: ";",
			gotoShortcut: "G",
			showControlsShortcut: "L",
			initialDelay: 2000,
			timeRate: 5.00,
			timeCtrlRate: 2.50,
			speedRate: 0.25,
			speedCtrlRate: 0.10,
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
	const controlsTable = new Table("controls", database);

	const browser = chrome;

	(async () => {
		populate(controlsTable, populateControls)
			.then(console.log)
			.catch(console.error);
		await populate(optionsTable, populateOptions)
			.then(console.log)
			.catch(console.error);
		browser.action.onClicked.addListener(actionOnClicked);
		if (!browser.storage.onChanged.hasListener(storageOnChanged)) {
			browser.storage.onChanged.addListener(storageOnChanged);
		}
		await updateActivated(await optionsTable.get("activated"));
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

	async function actionOnClicked() {
		try {
			await optionsTable.set("activated", !await optionsTable.get("activated"));
		} catch (error) {
			console.error(error);
		}
	}

	async function storageOnChanged(changes) {
		try {
			if (changes[optionsTable.name]) {
				await updateActivated(await optionsTable.get("activated"));
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function updateActivated(activated) {
		if (activated) {
			console.log("activated");
			await changeActionIcons({ iconsPrefix: "icon" });
		} else {
			console.log("deactivated");
			await changeActionIcons({ iconsPrefix: "icon-dark" });
		}
		for (const tab of await getAllTabs()) {
			browser.tabs.sendMessage(tab.id, { activated })
				.catch((reason) => {
					console.error(`Unable to send message to ${tab.url}`);
					console.error(reason);
					console.error();
				});
		}
	}

	function changeActionIcons({
		iconsPrefix="icon",
		iconsPath="../../icons",
		iconsExtension="png",
	}={}) {
		return browser.action.setIcon({
			path: "16 19 32 38"
				.split(" ")
				.reduce((obj, size) => {
					return {
						...obj,
						[size]: `${iconsPath}/${iconsPrefix}-${size}.${iconsExtension}`,
					};
				}, {}),
		});
	}

	function getAllTabs() {
		return browser.tabs.query({});
	}

})();
