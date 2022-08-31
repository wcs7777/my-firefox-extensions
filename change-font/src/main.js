import { createStyle } from "./utils.js";
import { optionsTable, websitesTable } from "./tables.js";

(async () => {
	try {
		const {
			shortcut,
			fontFamily,
			fontSize,
			lineHeight,
			activated,
		} = await optionsTable.getAll();
		if (activated) {
			const style = createStyle(`
				body, main, p {
					font: ${fontSize}/${lineHeight} "${fontFamily}" !important;
				}
			`);
			if (autoEnable(await websitesTable.getKeys(), window.location.href)) {
				console.log(enableCustomFont(style));
			}
			console.log(`Toggle custom font with Ctrl+${shortcut}`);
			document.addEventListener("keydown", (e) => {
				if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
					e.preventDefault();
					console.log(toggleCustomFont(style));
				}
			});
		}
	} catch (error) {
		console.error(error);
	}

	function autoEnable(websitesList, href) {
		return websitesList.find((website) => href.startsWith(website));
	}

	function toggleCustomFont(style) {
		return (
			document.head.contains(style) ?
			disableCustomFont(style) :
			enableCustomFont(style)
		);
	}

	function disableCustomFont(style) {
		style.remove();
		return "custom font disabled";
	}

	function enableCustomFont(style) {
		disableCustomFont(style);
		document.head.appendChild(style);
		return "custom font enabled";
	}
})()
	.catch(console.error);
