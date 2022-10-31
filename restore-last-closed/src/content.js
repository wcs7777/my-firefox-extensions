import { optionsTable } from "./tables.js";

(async () => {
	try {
		if (await optionsTable.get("activated")) {
			if (window.location.href === "about:blank") {
				const shortcut = await optionsTable.get("shortcut");
				document.addEventListener("keydown", async (e) => {
					try {
						if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
							e.preventDefault();
							await browser.runtime.sendMessage({
								restore: true,
							});
						}
					} catch (error) {
						console.error(error);
					}
				});
				await browser.runtime.onMessage.addListener(({ openUrl }) => {
					if (openUrl) {
						window.open(openUrl, "_self");
					}
				});
			} else {
				window.addEventListener("beforeunload", () => {
					browser.runtime.sendMessage({
						lastClosed: window.location.href,
					})
						.catch(console.error);
				});
			}
		}
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);
