export default class MutationObserverClosure {

	constructor({
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
		mutationCallback,
	}={}) {
		this.mutationObserver = new MutationObserver(mutationCallback);
		this.target = target;
		this.options = options;
		if (observe) {
			this.observe();
		}
	}

	observe() {
		this.mutationObserver.observe(this.target, this.options);
	}

	disconnect() {
		this.mutationObserver.disconnect();
	}

	takeRecords() {
		return this.mutationObserver.takeRecords();
	}

}
