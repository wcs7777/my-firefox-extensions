export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function tag(tagName) {
	return document.createElement(tagName);
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
