export default function populateControls(table) {
	return table.set({
		begin: ["0", "F2", "Home"],
		end: ["9", "End"],
		middle: ["1", "2", "3", "4", "5", "6", "7", "8"],
		backward: ["ArrowLeft", "MediaTrackPrevious"],
		forward: ["ArrowRight", "MediaTrackNext"],
		togglePlay: ["k", "K", "F1", "Enter"],
		increaseSpeed: ["["],
		decreaseSpeed: ["]"],
		resetSpeed: ["Dead"],
		increaseVolume: ["="],
		decreaseVolume: ["-"],
		toggleMute: ["m", "M"],
		toggleFullscreen: ["f", "F"],
		showCurrentTime: ["i", "I"],
		ctrl: {
			showControls: ["l", "L"],
			createRestorePoint: ["p", "P"],
			restoreSavePoint: ["e", "E"],
			toggleLoop: ["u", "U"],
			jumpToTime: ["g", "G"],
		},
	});
}
