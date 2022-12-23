export default function populateOptions(table) {
	return table.set({
		shortcut: ";",
		gotoShortcut: "G",
		showControlsShortcut: "L",
		initialDelay: 2000,
		timeRate: 5.00,
		timeCtrlRate: 2.50,
		speedRate: 0.25,
		speedCtrlRate: 0.10,
		activated: true,
	});
}
