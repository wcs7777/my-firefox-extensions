export default function populateOptions(table) {
	return table.set({
		shortcut: ";",
		initialDelay: 5000,
		timeRate: 5.00,
		timeCtrlRate: 2.50,
		speedRate: 0.25,
		speedCtrlRate: 0.10,
		activated: true,
	});
}
