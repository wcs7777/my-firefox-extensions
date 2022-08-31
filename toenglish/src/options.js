import { optionsTable } from "./tables.js";
import { $ } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [shortcut, activated] = getFieldsAndClean(
			["shortcut", "activated"],
		);
		if (shortcut.length > 0) {
			await optionsTable.set("shortcut", shortcut.toUpperCase());
		}
		await optionsTable.set("activated", activated === "true");
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("shortcut").addEventListener("keydown", (e) => {
	if (e.key === " ") {
		e.preventDefault();
	}
});

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
