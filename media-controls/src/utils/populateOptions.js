export default function populateOptions(table) {
	return table.set({
		shortcut: ";",
		synchronizeValueShortcut: "S",
		timeRate: 5.00,
		timeCtrlRate: 2.50,
		speedRate: 0.25,
		speedCtrlRate: 0.10,
		volumeRate: 0.05,
		activated: true,
	});
}
