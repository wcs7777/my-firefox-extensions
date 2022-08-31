import { optionsTable } from "./tables.js";

(async () => {
	try {
		const { shortcut, tabs } = await optionsTable.getAll();
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
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

function addTabs(currentUrl, tabs) {
	const url = currentUrl.replace(/\??&?ts=\d+/, "");
	return url + (url.includes("?") ? "&" : "?") + `ts=${tabs}`;
}
