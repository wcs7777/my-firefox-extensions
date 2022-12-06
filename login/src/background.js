import populateOptions from "./populate-options.js";
import { utilsTable, optionsTable } from "./tables.js";

(async () => {
	await populate(optionsTable, populateOptions);
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function populate(table, fn) {
	if (!await utilsTable.get(table.name)) {
		await fn(table);
		await utilsTable.set(table.name, true);
	}
	return `${table.name} populated`;
}
