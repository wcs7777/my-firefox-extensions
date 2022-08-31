import { $$, tag, textNode } from "./utils.js";
import { optionsTable } from "./tables.js";

const attribute = "data-addon-highlight-selection";

(async () => {
	try {
		const {
			shortcut,
			shortcutHighlights,
			color,
			backgroundColor,
			underline,
			activated,
		} = await optionsTable.getAll();
		if (activated) {
			const style = makeStyle(color, backgroundColor, underline);
			document.addEventListener("keydown", (e) => {
				const key = e.key.toUpperCase();
				if (key === shortcut) {
					e.preventDefault();
					highlighSelection(style);
				} else if (key === shortcutHighlights) {
					e.preventDefault();
					console.clear();
					console.log(highlights().join("\n"));
				}
			});
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
		range.insertNode(createHightlight(text, style));
	}
	selection.removeAllRanges();
}

function highlights() {
	return $$(`[${attribute}="true"]`).map((h) => h.textContent);
}

function createHightlight(text, style) {
	const span = tag("span");
	span.style.cssText = style;
	span.setAttribute(attribute, true);
	span.appendChild(textNode(text));
	return span;
}
