import downloadObject from "./download-object.js";

(async () => {
	if (!browser.browserAction.onClicked.hasListener(actionOnClicked)) {
		browser.browserAction.onClicked.addListener(actionOnClicked);
	}
	return "Initialization finished";
})()
	.then(console.log)
	.catch(console.error);

async function actionOnClicked() {
	try {
		const tabs = await getAllTabs();
		await downloadObject(
			tabs.map((tab) => [tab.title, tab.url]),
			`tabs-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.txt`,
		);
	} catch (error) {
		console.error(error);
	}
}

function getAllTabs() {
	return browser.tabs.query({ currentWindow: true });
}

