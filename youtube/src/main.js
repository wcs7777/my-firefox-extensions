import { optionsTable } from "./tables.js";
import { $, $$, onLocationChange, sleep, waitForElement } from "./utils.js";

(async () => {
	try {
		const shortcut = await optionsTable.get("shortcut");
		onLocationChange(() => main(shortcut));
		await main(shortcut);
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);

async function main(shortcut) {
	await waitForElement("video", 250, 8000);
	document.addEventListener("keydown", async (e) => {
		try {
			if (e.key === shortcut) {
				e.preventDefault();
				await chooseHighestQuality();
			}
		} catch (error) {
			console.error(error);
		}
	});
}

function chooseHighestQuality() {
	return setQuality("Highest");
}

function toggleSearchBar() {
	const searchBar = $("#masthead-container");
	searchBar.style.visibility = (
		searchBar.style.visibility === "hidden" ? "visible" : "hidden"
	);
}

async function setQuality(quality) {
	const ms = 600;
	const settingsButton = $(".ytp-settings-button");
	settingsButton.click();
	await sleep(ms);
	$(".ytp-panel-menu").lastChild.click();
	await sleep(ms);
	const qualityOptions = $$(".ytp-menuitem");
	const selection = (
		quality === "Highest" ?
		qualityOptions[0] :
		qualityOptions.find((option) => option.innerText === quality)
	);
	if (selection) {
		if (selection.attributes["aria-checked"] === undefined) {
			selection.click();
		}
	} else {
		const qualityTexts = qualityOptions
			.map((option) => option.innerText)
			.join("\n");
		console.log(`"${quality} not found. Options are:`);
		console.log(`Highest\n${qualityTexts}`);
	}
	settingsButton.click();
}
