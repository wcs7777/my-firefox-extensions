import { optionsTable } from "./tables.js";
import { byId, isNumber } from "./utils.js";

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

onlyShortcut(byId("shortcut"));

[
	byId("timeRate"),
	byId("timeCtrlRate"),
	byId("speedRate"),
	byId("speedCtrlRate"),
]
	.forEach(onlyFloat);

[
	byId("waitTimeout"),
	byId("waitInterval"),
]
	.forEach(onlyInt);

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

function onlyInt(target) {
	target.addEventListener("keydown", (e) => {
		if (!isNumber(e.key) && !isNavigationKey(e)) {
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
