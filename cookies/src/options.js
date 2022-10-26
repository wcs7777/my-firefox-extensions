import { websitesTable } from "./tables.js";
import { $, createOption, fragment } from "./utils.js";

element("addAutoRemoveCookiesWebsite")
	.addEventListener("submit", async (e) => {
		try {
			e.preventDefault();
			const [website] = getFieldsAndClean(["website"]);
			if (website.length > 0) {
				const site = website.toLowerCase();
				await websitesTable.set(
					site.endsWith("/") ? site + "*" : site + "/*",
					true,
				);
			}
			await setFieldValues();
		} catch (error) {
			console.error(error);
		}
	});

element("removeAutoRemoveCookiesWebsite")
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

element("website").addEventListener("keydown", (e) => {
	if (e.key === " ") {
		e.preventDefault();
	}
});

async function setFieldValues() {
	try {
		const keys = await websitesTable.getKeys();
		const select = element("removeWebsite");
		while (select.options.length > 0) {
			select.options[0].remove();
		}
		select.appendChild(
			fragment([
				createOption("", "", true),
				...keys.map((key) => createOption(key))
			]),
		);
	} catch (error) {
		console.error(error);
	}
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
