import { optionsTable } from "./tables.js";

export async function commonLogic(listener) {
	try {
		const { shortcut, activated } = await optionsTable.getAll();
		if (activated) {
			document.addEventListener("keydown", (e) => {
				if (e.key === shortcut) {
					listener();
				}
			});
		}
	} catch (error) {
		console.error(error);
	}
}
