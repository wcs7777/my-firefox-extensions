import { optionsTable } from "./tables.js";
import { $$, onLocationChange } from "./utils.js";

(async () => {
	try {
		if (await optionsTable.get("activated")) {
			main();
			onLocationChange(main);
		}
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

function main() {
	for (const anchor of $$("a[href]")) {
		anchor.addEventListener("click", async (e) => {
			e.preventDefault();
			const url = anchor.href;
			try {
				if (!await browser.runtime.sendMessage({ url })) {
					throw new Error("Error in the background script!");
				}
			} catch (error) {
				confirm(error.toString());
				window.open(url, "_blank");
			}
		});
	}
}
