import { utilsTable, suggestionsTable } from "./tables.js";
import { $, createOption } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setSuggestion").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [
			keyword,
			templateUrl,
			textSlot,
			spaceReplacement,
		] = getFieldsAndClean([
			"keyword",
			"templateUrl",
			"textSlot",
			"spaceReplacement",
		]);
		if (keyword.length > 0 && templateUrl.length > 0) {
			await suggestionsTable.set(keyword.toLowerCase(), {
				templateUrl,
				textSlot: textSlot ? textSlot : undefined,
				spaceReplacement: spaceReplacement ? spaceReplacement : " ",
			});
		}
	} catch (error) {
		console.error(error);
	}
});

element("setDefaultKeyword").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [defaultKeyword] = getFieldsAndClean(["defaultKeyword"]);
		if (defaultKeyword.length > 0) {
			await utilsTable.set("defaultKeyword", defaultKeyword);
		}
	} catch (error) {
		console.error(error);
	}
});

element("removeSuggestion").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const [removeKeyword] = getFieldsAndClean(["removeKeyword"]);
		if (removeKeyword.length > 0) {
			const keyword = removeKeyword.toLowerCase();
			await suggestionsTable.remove(keyword);
			if (keyword === await utilsTable.get("defaultKeyword")) {
				await utilsTable.set(
					"defaultKeyword",
					(await suggestionsTable.getKeys())[0],
				);
			}
		}
	} catch (error) {
		console.error(error);
	}
});

document.addEventListener("submit", setFieldValues);

[
	element("keyword"),
	element("templateUrl"),
	element("removeKeyword"),
]
	.forEach((input) => {
		input.addEventListener("keydown", (e) => {
			if (e.key === " ") {
				e.preventDefault();
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
		const defaultKeyword = await utilsTable.get("defaultKeyword");
		const options = document.createDocumentFragment();
		for (const key of await suggestionsTable.getKeys()) {
			options.appendChild(createOption(key, key, key === defaultKeyword));
		}
		const select = element("defaultKeyword");
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
