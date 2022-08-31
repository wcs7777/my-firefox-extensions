export default function populateControls(table) {
	return table.set({
		begin: ["0", "F2", "Home", "PageUp"],
		end: ["9", "End", "PageDown"],
		middle: ["1", "2", "3", "4", "5", "6", "7", "8"],
		backward: ["ArrowLeft", "MediaTrackPrevious"],
		forward: ["ArrowRight", "MediaTrackNext"],
		togglePlay: ["k", "K", "F1", "Enter"],
		increaseSpeed: ["["],
		decreaseSpeed: ["]"],
		resetSpeed: ["Dead"],
		increaseVolume: ["ArrowUp"],
		decreaseVolume: ["ArrowDown"],
		toggleMute: ["m", "M"],
	});
}
