import { optionsTable } from "./tables.js";
import { byId } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
	try {
		setField("shortcut", await optionsTable.get("shortcut"));
	} catch (error) {
		console.error(error);
	}
});

byId("setShortcut").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		await optionsTable.set("shortcut", extractFieldValue("shortcut"));
		setField("shortcut", await optionsTable.get("shortcut"));
	} catch (error) {
		console.error(error);
	}
});

byId("setLogin").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		await optionsTable.set(extractFieldsValues(["email", "password"]));
	} catch (error) {
		console.error(error);
	}
});

onlyShortcut(byId("shortcut"));

function setField(id, value) {
	return byId(id).value = value;
}

function extractFieldsValues(idFields) {
	return idFields.reduce((values, id) => {
		values[id] = extractFieldValue(id);
		return values;
	}, {});
}

function extractFieldValue(idField) {
	const field = byId(idField);
	const value = field.value.trim();
	field.value = "";
	return value;
}

function onlyShortcut(target) {
	target.addEventListener("keydown", (e) => {
		if (e.key.length === 1) {
			e.preventDefault();
			e.target.value = e.key.toUpperCase();
		}
	});
}
