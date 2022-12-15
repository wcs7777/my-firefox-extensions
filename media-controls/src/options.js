import { optionsTable, controlsTable } from "./tables.js";
import { byId, file2object, isNumber } from "./utils.js";
import downloadObject from "./download-object.js";

document.addEventListener("DOMContentLoaded", async () => {
	try {
		setFieldsValues(await optionsTable.getAll());
	} catch (error) {
		console.error(error);
	}
});

byId("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		await optionsTable.set(
			normalizeOptions(
				extractFieldsValues(await optionsTable.getKeys())
			),
		);
		const options = await optionsTable.getAll();
		setFieldsValues(options);
		console.log(options);
	} catch (error) {
		console.error(error);
	}
});

byId("downloadControlsTable").addEventListener("click", async (e) => {
	try {
		e.preventDefault();
		downloadObject(
			await controlsTable.getAll(),
			"media-controls-controls-table.json",
		)
			.then(console.log)
			.catch(console.error);
	} catch (error) {
		console.error(error);
	}
});

byId("updateControlsTable").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const file = extractFile("controlsTable");
		if (file) {
			await controlsTable.set(await file2object(file));
		}
	} catch (error) {
		console.error(error);
	}
});

onlyShortcut(byId("shortcut"));
onlyInt(byId("initialDelay"));

[
	byId("timeRate"),
	byId("timeCtrlRate"),
	byId("speedRate"),
	byId("speedCtrlRate"),
]
	.forEach(onlyFloat);

function setFieldsValues(ids2values) {
	for (const [id, value] of Object.entries(ids2values)) {
		setField(id, value);
	}
}

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

function extractFile(id) {
	const field = byId(id);
	const file = field.files?.[0];
	field.value = "";
	return file;
}

function normalizeOptions(options) {
	return {
		...options,
		activated: options.activated === "true",
	};
}

function onlyShortcut(target) {
	target.addEventListener("keydown", (e) => {
		if (e.key.length === 1) {
			e.preventDefault();
			e.target.value = e.key.toUpperCase();
		}
	});
}

function onlyInt(target) {
	target.addEventListener("keydown", (e) => {
		if (
			!isNumber(e.key) &&
			!isNavigationKey(e) &&
			true
		) {
			e.preventDefault();
		}
	});
}

function onlyFloat(target) {
	target.addEventListener("keydown", (e) => {
		if (
			!isNumber(e.key) &&
			(e.key !== "." || field.value.includes(".")) &&
			!isNavigationKey(e) &&
			true
		) {
			e.preventDefault();
		}
	});
}

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
