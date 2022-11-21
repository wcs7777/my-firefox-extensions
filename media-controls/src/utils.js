export function $(selectors, target=document) {
	return target.querySelector(selectors);
}

export function $$(selectors, target=document) {
	return Array.from(target.querySelectorAll(selectors));
}

export function byId(elementId) {
	return document.getElementById(elementId);
}

export function tag(tagName) {
	return document.createElement(tagName);
}

export function textNode(data) {
	return document.createTextNode(data);
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
	target=document,
	timeout=0,
	interval=500,
}={}) {
	return new Promise((resolve, reject) => {
		const selectorsArray = toArray(selectors);
		const elem = find();
		if (elem !== undefined) {
			return resolve(elem);
		}
		const idInterval = setInterval(() => {
			const element = find();
			if (element !== undefined) {
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

		function find() {
			return selectorsArray.find((s) => hasChild(s, target));
		}

		function clearTimers() {
			clearInterval(idInterval);
			if (idTimeout !== false) {
				clearTimeout(idTimeout);
			}
		}

	});
}

export function hasChild(selectors, target=document) {
	return $(selectors, target) !== null;
}

export function onLocationChange(listener) {
	onLocationChange.current = (
		onLocationChange.current || document.location.href
	);
	const observer = new MutationObserver(async () => {
		if (onLocationChange.current !== document.location.href) {
			onLocationChange.current = document.location.href;
			if (listener.constructor.name === "AsyncFunction") {
				await listener();
			} else {
				listener();
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
	return observer;
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

export function min(a, b) {
	return a < b ? a : b;
}

export function max(a, b) {
	return a > b ? a : b;
}
