const onClickedListener = {
	listener: () => {},

	add(listener) {
		if (browser.menus.onClicked.hasListener(this.listener)) {
			browser.menus.onClicked.removeListener(this.listener)
		}
		this.listener = listener;
		browser.menus.onClicked.addListener(this.listener);
	},
};

export default onClickedListener;
