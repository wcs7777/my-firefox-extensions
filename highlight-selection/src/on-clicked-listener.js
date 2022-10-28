const onClickedListener = {
	listener: () => {},

	add(listener) {
		this.listener = listener;
		browser.menus.onClicked.addListener(this.listener);
	},

	remove() {
		if (browser.menus.onClicked.hasListener(this.listener)) {
			browser.menus.onClicked.removeListener(this.listener);
		}
	},
};

export default onClickedListener;
