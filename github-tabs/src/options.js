import { optionsTable } from "./tables.js";
import { $, isNumber } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [shortcut, tabs] = getFieldsAndClean(["shortcut", "tabs"]);
		if (shortcut.length > 0) {
			await optionsTable.set("shortcut", shortcut.toUpperCase());
		}
		if (tabs.length > 0) {
			await optionsTable.set({ tabs });
		}
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("tabs").addEventListener("keydown", (e) => {
	if (!isNumber(e.key) && !isNavigationKey(e)) {
		e.preventDefault();
	}
});

function isNavigationKey(keydownEvent) {
	return keydownEvent.ctrlKey || [
		"Backspace",
		"Delete",
		"ArrowLeft",
		"ArrowRight",
		"Tab",
		"CapsLock",
		"Home",
		"End",
		"Enter",
	]
		.includes(keydownEvent.key);
}

async function setFieldValues() {
	try {
		const keys = await optionsTable.getKeys();
		const values = await optionsTable.get(keys);
		for (let i = 0; i < keys.length; ++i) {
			setField(keys[i], values[i]);
		}
	} catch (error) {
		console.error(error);
	}
}

function setField(id, value) {
	return element(id).value = value;
}

function element(id) {
	return $(`#${id}`);
}

function getFieldsAndClean(idFields) {
	return idFields.map((id) => {
		const field = element(id);
		const value = field.value.trim();
		field.value = "";
		return value;
	});
}
