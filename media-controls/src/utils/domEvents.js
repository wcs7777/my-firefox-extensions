import { $, $$ } from "./domElements.js";
import { toArray } from "./mixed.js";
import MutationObserverClosure from "./MutationObserverClosure.js";

export function waitElement({
	selectors,
	target=document.body,
	interval=100,
	timeout=20000,
}={}) {
	return new Promise((resolve, reject) => {
		const idInterval = setInterval(searchElement, interval);
		const idTimeout = setTimeout(() => {
			clear();
			reject(`${selectors} not found in ${timeout}ms`);
		}, timeout);

		function searchElement() {
			const element = $(selectors, target);
			if (element) {
				clear();
				resolve(element);
			}
		}

		function clear() {
			clearInterval(idInterval);
			clearTimeout(idTimeout);
		}
	});
}

export function onAppend({
	selectors,
	target=document.body,
	options={
		childList: true,
		subtree: false,
		attributes: false,
		attributeOldValue: false,
		characterData: false,
		characterDataOldValue: false,
	},
	observe=true,
	listener,
}={}) {
	return new MutationObserverClosure({
		target,
		options,
		observe,
		mutationCallback: (mutationRecords) => {
			for (const mutationRecord of mutationRecords) {
				const addedNodes = Array.from(mutationRecord.addedNodes);
				let nodes = [];
				if (addedNodes.length > 0) {
					if (selectors) {
						nodes = $$(selectors, target).filter((queried) => {
							return addedNodes.some((node) => node.contains(queried));
						});
					} else {
						nodes = addedNodes;
					}
				}
				if (nodes.length > 0) {
					listener(nodes, mutationRecord.target);
					break;
				}
			}
		},
	});
}

export function onRemoved({
	element,
	target=document.body,
	options={
		childList: true,
		subtree: false,
		attributes: false,
		attributeOldValue: false,
		characterData: false,
		characterDataOldValue: false,
	},
	observe=true,
	listener,
}={}) {
	return new MutationObserverClosure({
		target,
		options,
		observe,
		mutationCallback: (mutationRecords, mutationObserver) => {
			for (const mutationRecord of mutationRecords) {
				const removedNodes = Array.from(mutationRecord.removedNodes);
				if (removedNodes.some((removed) => removed.contains(element))) {
					listener(element);
					mutationObserver.disconnect();
					break;
				}
			}
		},
	});
}

export function createOnKeydown({
	keys,
	caseSensitive=true,
	ctrlKey=false,
	altKey=false,
	shiftKey=false,
	preventDefault=true,
	bypassField=false,
	listener,
}={}) {
	const onKeys = (
		caseSensitive ?
		toArray(keys) :
		toArray(keys).map((key) => key.toLowerCase())
	);
	return (e) => {
		if (
			onKeys.includes(caseSensitive ? e.key : e.key.toLowerCase()) &&
			e.ctrlKey === ctrlKey &&
			e.altKey === altKey &&
			e.shiftKey === shiftKey &&
			(!bypassField || !isField(e)) &&
			true
		) {
			if (preventDefault) {
				e.preventDefault();
			};
			listener(e);
		}
	};

	function isField(event) {
		const tagName = event.target.tagName.toLowerCase();
		return (
			["input", "textarea"].includes(tagName) ||
			event.target.hasAttribute("contenteditable") ||
			false
		);
	}
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
