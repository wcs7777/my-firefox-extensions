export const onClickedListeners = {
	list: [],

	add(listener) {
		this.list.push(listener);
		browser.menus.onClicked.addListener(listener);
	},

	removeAll() {
		while (this.list.length > 0) {
			browser.menus.onClicked.removeListener(this.list.pop());
		}
	},
};

export function createParentMenuItem(id, title) {
	return browser.menus.create({
		id,
		title,
		contexts: ["all"],
	});
}

export function createChildMenuItem(id, title, parentId) {
	return browser.menus.create({
		id,
		title,
		parentId,
		contexts: ["all"],
	});
}