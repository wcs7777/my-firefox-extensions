import { optionsTable } from "../utils/tables.js";
import { byId, toArray } from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
	try {
		setFields(await optionsTable.getAll());
	} catch (error) {
		console.error(error);
	}
});

byId("options").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const ids = await optionsTable.getKeys();
		const fields = getFields(ids);
		clearFields(ids);
		fields.reverseOrder = fields.reverseOrder === "true";
		await optionsTable.set(fields);
		setFields(fields);
	} catch (error) {
		console.error(error);
	}
});

byId("accessKey").addEventListener("keydown", (e) => {
	e.preventDefault();
	e.target.value = e.key.toUpperCase();
});

function getField(id) {
	return byId(id).value;
}

function getFields(ids) {
	const fields = {};
	for (const id of toArray(ids)) {
		fields[id] = getField(id);
	}
	return fields;
}

function setField(id, value) {
	byId(id).value = value;
}

function setFields(fields) {
	try {
		for (const [field, value] of Object.entries(fields)) {
			setField(field, value);
		}
	} catch (error) {
		console.error(error);
	}
}

function clearFields(ids) {
	for (const id of ids) {
		setField(id, "");
	}
}
