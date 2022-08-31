import { optionsTable, websitesTable } from "./tables.js";
import { $, isAlphanumeric, createOption } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const keys = await optionsTable.getKeys();
		const values = getFieldsAndClean(keys);
		if (values.every((value) => value.length > 0)) {
			const options = keys.reduce((obj, key, i) => {
				return { ...obj, [key]: values[i] };
			}, {});
			await optionsTable.set({
				...options,
				shortcut: options.shortcut.toUpperCase(),
				activated: options.activated === "true",
			});
		}
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("addAutoEnableCustomFontWebsite")
	.addEventListener("submit", async (e) => {
		try {
			e.preventDefault();
			const [website] = getFieldsAndClean(["website"]);
			if (website.length > 0) {
				await websitesTable.set(website.toLowerCase(), true);
			}
			await setFieldValues();
		} catch (error) {
			console.error(error);
		}
	});

element("removeAutoEnableCustomFontWebsite")
	.addEventListener("submit", async (e) => {
		try {
			e.preventDefault();
			const [website] = getFieldsAndClean(["removeWebsite"]);
			if (website.length > 0) {
				await websitesTable.remove(website.toLowerCase());
			}
			await setFieldValues();
		} catch (error) {
			console.error(error);
		}
	});

element("shortcut").addEventListener("keydown", (e) => {
	if (!isNavigationKey(e)) {
		e.preventDefault();
		if (isAlphanumeric(e.key)) {
			e.target.value = e.key.toUpperCase();
		}
	}
});

element("website").addEventListener("keydown", (e) => {
	if (e.key === " ") {
		e.preventDefault();
	}
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
		const options = document.createDocumentFragment();
		options.appendChild(createOption("", "", true));
		for (const key of await websitesTable.getKeys()) {
			options.appendChild(createOption(key));
		}
		const select = element("removeWebsite");
		while (select.options.length > 0) {
			select.options[0].remove();
		}
		select.appendChild(options);
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
