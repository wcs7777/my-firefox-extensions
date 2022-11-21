export default function populateOptions(table) {
	return table.set({
		shortcut: ";",
		timeRate: 5.00,
		timeCtrlRate: 2.50,
		speedRate: 0.25,
		speedCtrlRate: 0.10,
		waitTimeout: 0,
		waitInterval: 1000,
		activated: true,
	});
}
