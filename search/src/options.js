import { utilsTable, parentItemTable, itemsTable } from "./tables.js";
import { $, isAlphanumeric } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setItem").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [
			accessKey,
			title,
			templateUrl,
			textSlot,
			spaceReplacement,
			isPopup,
		] = getFieldsAndClean([
			"accessKey",
			"title",
			"templateUrl",
			"textSlot",
			"spaceReplacement",
			"isPopup",
		]);
		if (accessKey.length > 0 && title.length > 0 && templateUrl.length > 0) {
			await itemsTable.set(accessKey, {
				title,
				templateUrl,
				textSlot: textSlot ? textSlot : undefined,
				spaceReplacement: spaceReplacement ? spaceReplacement : " ",
				isPopup: isPopup === "true",
			});
		}
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("removeItem").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [removeAccessKey] = getFieldsAndClean(["removeAccessKey"]);
		if (removeAccessKey.length > 0) {
			await itemsTable.remove(removeAccessKey);
		}
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("setParentItemAccessKey").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [parentItemAccessKey] = getFieldsAndClean(["parentItemAccessKey"]);
		if (parentItemAccessKey.length > 0) {
			await parentItemTable.set("accessKey", parentItemAccessKey);
		}
		await setFieldValues();
	} catch (error) {
		console.error(error);
	}
});

element("templateUrl").addEventListener("keydown", (e) => {
		if (e.key === " ") {
			e.preventDefault();
		}
});

[
	element("accessKey"),
	element("removeAccessKey"),
	element("parentItemAccessKey"),
]
	.forEach((input) => {
		input.addEventListener("keydown", (e) => {
			if (!isNavigationKey(e)) {
				e.preventDefault();
				if (isAlphanumeric(e.key)) {
					input.value = e.key.toUpperCase();
				}
			}
		});
	});

[
	element("textSlot"),
	element("spaceReplacement"),
]
	.forEach((input) => {
		input.addEventListener("keydown", (e) => {
			if (!isNavigationKey(e)) {
				e.preventDefault();
				if (e.key !== " ") {
					input.value = e.key;
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
		setField(
			"textSlot",
			await utilsTable.get("textSlot"),
		);
		setField(
			"spaceReplacement",
			await utilsTable.get("spaceReplacement"),
		);
		setField(
			"parentItemAccessKey",
			await parentItemTable.get("accessKey"),
		);
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
