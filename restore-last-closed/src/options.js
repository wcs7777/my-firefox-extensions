import { optionsTable } from "./tables.js";
import { $, toArray } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [shortcut, activated] = getFieldsValuesAndClean(
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

async function setFieldValues() {
	try {
		for (const [key, value] of Object.entries(await optionsTable.getAll())) {
			setField(key, value);
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

function getFieldsValuesAndClean(idFields) {
	return toArray(idFields).map((id) => {
		const field = element(id);
		const value = field.value.trim();
		field.value = "";
		return value;
	});
}
