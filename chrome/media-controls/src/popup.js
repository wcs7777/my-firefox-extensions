import { tag } from "./utils";

export function createPopup(textNode) {
	return tag({
		tagName: "span",
		textNode,
		cssText: `
			position: fixed;
			top: 100px;
			left: 80px;
			padding: 2px;
			color: rgb(255, 255, 255);
			background-color: rgba(0, 0, 0, .8);
			font: 25px/1.2 Arial, sens-serif;
			z-index: 99999;
		`,
	});
}

export function showPopup(popup, timeout) {
	document.body.appendChild(popup);
	setTimeout(() => popup.remove(), timeout);
}
