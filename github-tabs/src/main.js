import { optionsTable } from "./tables.js";
import { onLocationChange } from "./utils.js";

(async () => {
	try {
		const { shortcut, tabs } = await optionsTable.getAll();
		addTabsAutomatically();
		onLocationChange(addTabsAutomatically);
		document.addEventListener("keydown", async (e) => {
			try {
				if (e.key === shortcut) {
					e.preventDefault();
					window.open(
						addTabs(window.location.href, tabs),
						"_self",
					);
				}
			} catch (error) {
				console.error(error);
			}
		});

		function addTabsAutomatically() {
			if (
				window.location.href.includes("/blob/") &&
				!window.location.href.includes("ts=")
			) {
				window.open(
					addTabs(window.location.href, tabs),
					"_self",
				);
			}
		}
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

function addTabs(currentUrl, tabs) {
	const url = currentUrl.replace(/\??&?ts=\d+/, "");
	return url + (url.includes("?") ? "&" : "?") + `ts=${tabs}`;
}
