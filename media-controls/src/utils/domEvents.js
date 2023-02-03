import { $, $$ } from "./domElements.js";
import { toArray } from "./mixed.js";

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

export function createOnKeydown({
	keys,
	caseSensitive=true,
	ctrlKey=false,
	altKey=false,
	shiftKey=false,
	preventDefault=true,
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
			true
		) {
			if (preventDefault) {
				e.preventDefault();
			};
			listener(e);
		}
	};
}

export function manageEvents({ target, type, on, listeners }) {
	const manager = {
		target,
		type,
		listeners: toArray(listeners).map((listener) => {
			listener.__isOn = false;
			return listener;
		}),

		add(listeners) {
			for (const listener of toArray(listeners)) {
				if (!this.listeners.includes(listener)) {
					this.listeners.push(listener);
				}
			}
		},

		remove(listeners) {
			const list = toArray(listeners);
			this.listeners = this.listeners.filter((listener) => {
				return !list.includes(listener);
			});
		},

		on() {
			this.toggle(true);
		},

		off() {
			this.toggle(false);
		},

		/**
		 * @param {boolean} newState
		 */
		toggle(newState) {
			for (const listener of this.listeners) {
				if (listener.__isOn !== newState) {
					if (newState) {
						this.target.addEventListener(this.type, listener);
					} else {
						this.target.removeEventListener(this.type, listener);
					}
					listener.__isOn = newState;
				}
			}
		},

	};

	if (on) {
		manager.on();
	}

	return manager;
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
