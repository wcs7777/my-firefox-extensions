import { threshold } from "./utils";

export default async function doAction({
	media,
	action,
	key,
	timeRate,
	speedRate,
	minSpeed,
	maxSpeed,
	volumeRate,
}) {
	return {
		"begin": () => {
			return media.currentTime = 0;
		},
		"end": () => {
			return media.currentTime = media.duration;
		},
		"middle": () => {
			return media.currentTime = media.duration * (parseInt(key) / 10);
		},
		"backward": () => {
			return media.currentTime -= timeRate;
		},
		"forward": () => {
			return media.currentTime += timeRate;
		},
		"togglePlay": () => {
			return media.paused ? media.play() : media.pause();
		},
		"increaseSpeed": () => {
			return increasePlaybackRate(speedRate);
		},
		"decreaseSpeed": () => {
			return increasePlaybackRate(-speedRate);
		},
		"resetSpeed": () => {
			return media.playbackRate = 1;
		},
		"increaseVolume": () => {
			return increaseVolume(volumeRate);
		},
		"decreaseVolume": () => {
			return increaseVolume(-volumeRate);
		},
		"toggleMute": () => {
			return media.muted = !media.muted;
		},
	}[action]();

	function increasePlaybackRate(rate) {
		return media.playbackRate = threshold(
			media.playbackRate + rate,
			minSpeed,
			maxSpeed,
		);
	}

	function increaseVolume(rate) {
		return media.volume = threshold(media.volume + rate, 0.00, 1.00);
	}
}
