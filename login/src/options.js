import { optionsTable } from "./tables.js";
import { byId } from "./utils.js";

byId("setLogin").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const domain = byId("domain").value;
		const logins = await optionsTable.get(domain);
		const index = Math.min(
			parseInt(byId("shortcut").value) - 1,
			logins.length,
		);
		logins[index] = extractFieldsValues(["user", "password"]);
		await optionsTable.set(domain, logins);
	} catch (error) {
		console.error(error);
	}
});

byId("removeLogin").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const domain = byId("removeDomain").value;
		const logins = await optionsTable.get(domain);
		const removeIndex = parseInt(byId("removeShortcut").value) - 1;
		const filtered = logins.filter((_, index) => removeIndex !== index );
		if (filtered.length === 0) {
			filtered.push({ user: "user", password: "password" });
		}
		await optionsTable.set(domain, filtered);
	} catch (error) {
		console.error(error);
	}
});

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
