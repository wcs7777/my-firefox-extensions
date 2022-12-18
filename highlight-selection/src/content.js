import { $$, tag, textNode } from "./utils.js";
import { optionsTable } from "./tables.js";

const attribute = "data-addon-highlight-selection";

(async () => {
	try {
		const {
			shortcut,
			color,
			backgroundColor,
			underline,
			activated,
		} = await optionsTable.getAll();
		if (activated) {
			const style = makeStyle(color, backgroundColor, underline);
			document.addEventListener("keydown", (e) => {
				if (e.key.toUpperCase() === shortcut && hasSelection()) {
					e.preventDefault();
					highlighSelection(style);
				}
			});
			if (!browser.runtime.onMessage.hasListener(onMessage)) {
				browser.runtime.onMessage.addListener(onMessage);
			}

			function onMessage({ getData, highlight }, sender, sendResponse) {
				if (getData) {
					sendResponse({
						title: document.title,
						highlights: highlights(),
					});
				} else if (highlight) {
					highlighSelection(style);
					sendResponse({ highlight: true });
				}
			}
		}
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

function makeStyle(color, backgroundColor, underline) {
	const clr = color ? `color: ${color};` : "";
	const bc = backgroundColor ? `background-color: ${backgroundColor};` : "";
	const td = underline ? "text-decoration: underline;" : "";
	return clr + bc + td;
}

function highlighSelection(style) {
	const selection = window.getSelection();
	for (let i = 0; i < selection.rangeCount; ++i) {
		const range = selection.getRangeAt(i);
		const text = range.toString();
		range.deleteContents();
		range.insertNode(createHighlight(text, style));
	}
	selection.removeAllRanges();
}

function hasSelection() {
	return window.getSelection().toString().trim().length > 0;
}

function highlights() {
	return $$(`[${attribute}="true"]`).map((h) => h.textContent);
}

function createHighlight(text, style) {
	const span = tag("span");
	span.style.cssText = style;
	span.setAttribute(attribute, true);
	span.appendChild(textNode(text));
	return span;
}
