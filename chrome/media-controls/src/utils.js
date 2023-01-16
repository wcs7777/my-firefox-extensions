export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function byId(elementId) {
	return document.getElementById(elementId);
}

export function isNavigationKey(keydownEvent) {
	return keydownEvent.ctrlKey || [
		"Backspace",
		"Delete",
		"ArrowUp",
		"ArrowRight",
		"ArrowDown",
		"ArrowLeft",
		"Tab",
		"CapsLock",
		"Home",
		"End",
		"Enter",
	]
		.includes(keydownEvent.key);
}

export function tag({
	tagName,
	id,
	className,
	attributes,
	eventListeners,
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
		appendChildren(element, children);
	}
	return element;
}

export function textNode(data) {
	return document.createTextNode(data);
}

export function replaceSubstringAt(str, replacement, index) {
	return (
		str.substring(0, index) +
		replacement +
		str.substring(index + replacement.length) +
		""
	);
}

export function threshold(value, min, max) {
	return Math.max(Math.min(value, max), min);
}

export function isDigit(value) {
	return value.toString().length === 1 && "0123456789".includes(value);
}

export function object2blob(obj) {
	return new Blob(
		[JSON.stringify(obj, null, 2)],
		{ type: "application/json" },
	);
}

export function file2object(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", onLoad);
		reader.addEventListener("error", onError);
		reader.readAsText(file);

		function onLoad(e) {
			removeListeners();
			try {
				return resolve(JSON.parse(e.target.result));
			} catch (error) {
				return reject(error);
			}
		}

		function onError(error) {
			removeListeners();
			return reject(error);
		}

		function removeListeners() {
			reader.removeEventListener("load", onLoad);
			reader.removeEventListener("error", onError);
		}
	});
}

export function waitElement({
	selectors,
	target=document.body,
	timeout=0,
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

export function mutationObserverWrapper({
	target=document.body,
	options={ childList: true },
	mutationCallback,
}={}) {
	const mutation = new MutationObserver(mutationCallback);
	mutation.observe(target, options);
	return {
		beginObservation() {
			mutation.disconnect();
			return mutation.observe(target, options);
		},
		stopObservation() {
			return mutation.disconnect();
		},
	};
}

export function onAppend({
	selectors,
	target=document.body,
	options={ childList: true },
	listener,
	onRejected=console.error,
}={}) {
	return mutationObserverWrapper({
		target,
		options,
		mutationCallback: (mutations) => {
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
					listener(nodes, mutation.target)?.catch(onRejected);
					break;
				}
			}
		},
	});
}

export function onRemoved({
	element,
	target=document.body,
	options={ childList: true },
	listener,
	onRejected=console.error,
}={}) {
	return mutationObserverWrapper({
		target,
		options,
		mutationCallback: (mutations) => {
			for (const mutation of mutations) {
				const removedNodes = Array.from(mutation.removedNodes);
				if (removedNodes.some((removed) => removed.contains(element))) {
					listener(element)?.catch(onRejected);
					observer.disconnect();
					break;
				}
			}
		},
	});
}

export function onLocationChange(listener, onRejected=console.error) {
	onLocationChange.current = (
		onLocationChange.current || document.location.href
	);
	return mutationObserverWrapper({
		options: { childList: true, subtree: true },
		mutationCallback: () => {
			if (onLocationChange.current !== document.location.href) {
				onLocationChange.current = document.location.href;
				listener()?.catch(onRejected);
			}
		},
	});
}

export function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
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
