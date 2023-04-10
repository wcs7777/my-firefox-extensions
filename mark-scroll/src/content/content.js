if (!browser.runtime.onMessage.hasListener(onMessage)) {
	browser.runtime.onMessage.addListener(onMessage);
}

function onMessage(message) {
	if (message.getCurrentScroll) {
		return Promise.resolve(window.scrollY);
	}
}

