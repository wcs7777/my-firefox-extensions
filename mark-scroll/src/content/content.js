if (!browser.runtime.onMessage.hasListener(onMessage)) {
	browser.runtime.onMessage.addListener(onMessage);
}

function onMessage(message) {
	if (message.getCurrentScroll != null) {
		return Promise.resolve(window.scrollY);
	} else if (message.goToScrollMark != null) {
		window.scrollTo({
			top: message.goToScrollMark,
			behavior: "smooth",
		});
	}
}

