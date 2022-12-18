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

export function createMenuItem({
	id,
	title,
	parentId,
	contexts=["all"],
}={}) {
	return browser.menus.create({
		id,
		title,
		parentId,
		contexts,
	});
}
