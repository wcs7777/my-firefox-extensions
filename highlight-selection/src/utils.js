export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function tag(tagName, { id, className, children }={}) {
	const element = document.createElement(tagName);
	if (id) {
		element.id = id;
	}
	if (className) {
		element.className = className;
	}
	if (children) {
		element.appendChild(fragment([...toArray(children)]));
	}
	return element;
}

export function fragment(children) {
	const documentFragment = document.createDocumentFragment();
	for (const child of children) {
		documentFragment.appendChild(
			!isString(child) ? child : textNode(child),
		);
	}
	return documentFragment;
}

export function textNode(data) {
	return document.createTextNode(data);
}

export function createOption(value, text, selected=false) {
	const option = tag("option");
	option.value = value;
	option.appendChild(textNode(text ? text : value));
	if (selected) {
		option.setAttribute("selected", "selected");
	}
	return option;
}

export function createStyle(data) {
	const style = tag("style");
	style.appendChild(textNode(data));
	return style;
}

export function letters() {
	return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
}

export function numbers() {
	return "0123456789";
}

export function alphanumeric() {
	return letters() + numbers();
}

export function isLetter(character) {
	return letters().indexOf(character) > -1;
}

export function isNumber(character) {
	return numbers().indexOf(character) > -1;
}

export function isAlphanumeric(character) {
	return isLetter(character) || isNumber(character);
}

export function isString(value) {
  return Object.prototype.toString.call(value) === "[object String]"
}

export function toArray(value) {
	return Array.isArray(value) ? value : [value];
}

export function toObject(value) {
	return typeof value === "object" ? value : { [value]: value };
}
