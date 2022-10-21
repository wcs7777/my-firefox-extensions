import { optionsTable } from "./tables.js";
import { $ } from "./utils.js";

document.addEventListener("DOMContentLoaded", setFieldValues);

element("setOptions").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		await optionsTable.set({
			activated: element("activated").value === "true",
			toLeft: element("toLeft").value === "true",
		});
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
