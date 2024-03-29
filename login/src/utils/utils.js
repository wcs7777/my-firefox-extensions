export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function byId(elementId) {
	return document.getElementById(elementId);
}

export function appendChildren(parent, children) {
	for (const child of toArray(children)) {
		parent.appendChild(child);
	}
}

export function tag({
	tagName,
	id,
	className,
	attributes,
	listeners,
	cssText,
	textNode,
	children,
}={}) {
	const element = document.createElement(tagName);
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
	if (listeners) {
		for (const { type, listener } of toArray(listeners)) {
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
		appendChildren(element, children);
	}
	return element;
}

export function option(textNode, value) {
	return tag({
		tagName: "option",
		textNode,
		attributes: { name: "value", value },
	});
}

export function sequence(first, last, step=1) {
	const array = [];
	if (first <= last) {
		if (step <= 0) {
			throw new Error("Step must be positive");
		}
		for (let i = first; i <= last; i += step) {
			array.push(i);
		}
	} else {
		if (step >= 0) {
			throw new Error("Step must be negative");
		}
		for (let i = first; i >= last; i -= step) {
			array.push(i);
		}
	}
	return array;
}

export function digits() {
	return "0123456789";
}

export function isNumber(character) {
	return digits().indexOf(character) > -1;
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

export function object2blob(obj) {
	return new Blob(
		[JSON.stringify(obj, null, 2)],
		{ type: "application/json" },
	);
}

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function onAppend({
	selectors,
	target=document.body,
	options={ childList: true },
	listener,
	errorLogger=console.error,
}={}) {
	const mutation = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			const addedNodes = Array.from(mutation.addedNodes);
			let nodes = [];
			if (addedNodes.length > 0) {
				if (selectors) {
					nodes = $$(selectors, target).filter((element) => {
						return addedNodes.some((added) => {
							return added.contains(element);
						});
					});
				} else {
					nodes = addedNodes;
				}
			}
			if (nodes.length > 0) {
				listener(nodes, mutation.target)?.catch(errorLogger);
				break;
			}
		}
	});
	mutation.observe(target, options);
	return mutation;
}

export function waitElement({
	selectors,
	target=document.body,
	timeout=10000,
	interval=500,
}={}) {
	return new Promise((resolve, reject) => {
		const idInterval = setInterval(() => {
			const element = $(selectors, target);
			if (element != undefined) {
				clearTimers();
				resolve(element);
			}
		}, interval);
		const idTimeout = (
			timeout > 0 ?
			setTimeout(() => {
				clearTimers();
				reject(
					new Error(`${timeout} expired without found ${selectors}`),
				);
			}, timeout) :
			false
		);

		function clearTimers() {
			clearInterval(idInterval);
			if (idTimeout !== false) {
				clearTimeout(idTimeout);
			}
		}

	});
}

export async function waitInputToSetValue(selectors, value) {
	const input = await waitElement({ selectors });
	input.value = value;
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

export async function waitFormToSubmit(selectors) {
	const form = await waitElement({ selectors });
	return form.submit();
}
