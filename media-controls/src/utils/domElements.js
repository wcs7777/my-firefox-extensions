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

export function internalStyle(cssText) {
	const style = document.createElement("style");
	style.innerHTML = cssText;
	return style;
}

export function textNode(data) {
	return document.createTextNode(data);
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
