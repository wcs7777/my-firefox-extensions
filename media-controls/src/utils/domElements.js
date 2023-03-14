import { toArray } from "./mixed.js";

export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function byId(elementId) {
	return document.getElementById(elementId);
}

export function currentDomain() {
	return window.location.hostname || window.location.protocol;
}

export function internalStyle(cssText) {
	const style = document.createElement("style");
	style.innerHTML = cssText;
	return style;
}

export function textNode(data) {
	return document.createTextNode(data);
}

/**
 * @param {string} message
 * @param {number} timeout
 */
export function flashMessage(message, timeout=1200, fontSize=25) {
	console.log(message);
	flashElement(
		createPopup(
			message
				.split("\n")
				.map((line) => {
					return tag({
						tagName: "p",
						textNode: line,
						cssText: `
							margin: 0 0 3px;
							padding: 0;
						`
					});
				}),
			fontSize,
		),
		timeout,
		document.body,
	);
}

export function flashElement(element, timeout=1200, target=document.body) {
	target.appendChild(element);
	setTimeout(() => element.remove(), timeout);
}

export function createPopup(children, fontSize=25) {
	return tag({
		tagName: "div",
		children,
		cssText: `
			position: fixed;
			top: 100px;
			left: 80px;
			padding: 16px 16px 13px;
			color: rgb(255, 255, 255);
			background-color: rgba(0, 0, 0, .85);
			font: ${fontSize}px/1.2 Arial, sens-serif;
			z-index: 99999;
		`,
	});
}

export function tag({
	tagName,
	id,
	is,
	className,
	attributes,
	eventListeners,
	cssText,
	textNode,
	children,
}={}) {
	const element = document.createElement(tagName, { is });
	if (id) {
		element.id = id;
	}
	if (className) {
		element.className = className;
	}
	if (attributes) {
		for (const { name, value } of toArray(attributes)) {
			element.setAttribute(name, value);
		}
	}
	if (eventListeners) {
		for (const { type, listener } of toArray(eventListeners)) {
			element.addEventListener(type, listener);
		}
	}
	if (cssText) {
		element.style.cssText = cssText;
	}
	if (textNode) {
		element.appendChild(document.createTextNode(textNode));
	}
	if (children) {
		for (const child of toArray(children)) {
			element.appendChild(child);
		}
	}
	return element;
}
