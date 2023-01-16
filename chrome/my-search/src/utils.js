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

export function isString(value) {
  return Object.prototype.toString.call(value) === "[object String]"
}

export function makeUrl({
	templateUrl,
	words,
	textSlot="$",
	spaceReplacement="+",
}) {
	return templateUrl.replace(
		textSlot,
		words.join(spaceReplacement),
	);
}
