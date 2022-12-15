import { optionsTable } from "./tables.js";
import { appendChildren, byId, option, sequence, tag } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
	try {
		const domains = await optionsTable.getKeys();
		const shortcuts = sequence(1, 9).map((n) => n.toString());
		appendChildren(byId("domain"), createOptions(domains));
		appendChildren(byId("removeDomain"), createOptions(domains));
		appendChildren(byId("showUsersDomain"), createOptions(domains));
		appendChildren(byId("shortcut"), createOptions(shortcuts));
		appendChildren(byId("removeShortcut"), createOptions(shortcuts));

		function createOptions(values) {
			return values.map((value) => option(value, value));
		}
	} catch (error) {
		console.error(error);
	}
});

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

byId("setLoginsWithBundle").addEventListener("submit", async (e) => {
	try {
		e.preventDefault();
		const bundle = JSON.parse(extractFieldValue("bundleLogins"));
		await optionsTable.set(bundle);
	} catch (error) {
		console.error(error);
	}
});

byId("showUsersDomain").addEventListener("change", async (e) => {
	try {
		const id = "users";
		byId(id)?.remove();
		const logins = await optionsTable.get(e.target.value);
		byId("showUsers").appendChild(
			tag({
				tagName: "div",
				id,
				children: logins.map(({ user }, index) => {
					return tag({
						tagName: "div",
						textNode: `${index + 1} - ${user}`,
					});
				}),
			}),
		);
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
