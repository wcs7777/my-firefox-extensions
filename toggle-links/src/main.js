import { createStyle } from "./utils.js";
import { optionsTable, websitesTable } from "./tables.js";

const style = createStyle("a, span { pointer-events: none !important; }");

(async () => {
	try {
		if (await optionsTable.get("activated")) {
			if (autoDisable(await websitesTable.getKeys(), window.location.href)) {
				console.log(disableLinks());
			}
			const shortcut = await optionsTable.get("shortcut");
			console.log(`Toggle links with Alt+${shortcut}`);
			document.addEventListener("keydown", (e) => {
				if (e.altKey && e.key.toUpperCase() === shortcut) {
					e.preventDefault();
					console.log(toggleLinks());
				}
			});
		}
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

function autoDisable(websitesList, href) {
	return websitesList.find((website) => href.startsWith(website));
}

function toggleLinks() {
	return document.head.contains(style) ? enableLinks() : disableLinks();
}

function enableLinks() {
	style.remove();
	return "links enabled";
}

function disableLinks() {
	enableLinks();
	document.head.appendChild(style);
	return "links disabled";
}
