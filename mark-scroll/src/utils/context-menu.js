export const contextMenusListeners = {
	list: {},

	add(contextMenuId, listener) {
		this.list.push(listener);
	},

	removeAll() {
		while (this.list.length > 0) {
			browser.menus.onClicked.removeListener(this.list.pop());
		}
	},
};

export function createContextMenu({ id, title, parentId, contexts, listener }) {
	const contextMenuId = browser.menus.create({
		id,
		title,
		parentId,
		contexts,
	});
	if (listener) {
		contextMenusListeners.add(contextMenuId, listener);
	}
	return contextMenuId;
}

browser.menus.onClicked.addListener((info, tab) => {
	list[info.menuItemId]?.(info, tab);
	if (info.menuItemId === contextMenuId) {
		listener(info, tab);
	}
});

