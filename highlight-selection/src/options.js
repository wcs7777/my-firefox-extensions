import { optionsTable } from "./tables.js";
import { $, isAlphanumeric } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const keys = await optionsTable.getKeys();
		const values = getFieldsAndClean(keys);
		const options = keys.reduce((obj, key, i) => {
			return { ...obj, [key]: values[i] };
		}, {});
		await optionsTable.set({
			...options,
			shortcut: options.shortcut.toUpperCase(),
			underline: options.underline === "true",
			activated: options.activated === "true",
		});
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

[
	element("shortcut"),
	element("shortcutHighlights"),
]
	.forEach((field) => {
		field.addEventListener("keydown", (e) => {
			if (!isNavigationKey(e)) {
				e.preventDefault();
				if (isAlphanumeric(e.key)) {
					e.target.value = e.key.toUpperCase();
				}
			}
		});
	});

function isNavigationKey(keydownEvent) {
	return keydownEvent.ctrlKey || [
		"Backspace",
		"Delete",
		"ArrowUp",
		"ArrowRight",
		"ArrowDown",
		"ArrowLeft",
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
