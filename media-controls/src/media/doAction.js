import { threshold } from "../utils/alphanumeric.js";

/**
 * @param {HTMLMediaElement} media
 * @param {number} location
 */
export function jumpTo(media, location) {
	return media.currentTime = location;
}

/**
 * @param {HTMLMediaElement} media
 */
export function jumpToBegin(media) {
	return jumpTo(media, 0);
}

/**
 * @param {HTMLMediaElement} media
 */
export function jumpToEnd(media) {
	return jumpTo(media, media.duration);
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} percentage
 */
export function jumpToMiddle(media, percentage) {
	return jumpTo(media, media.duration * percentage);
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 */
export function forward(media, rate) {
	return jumpTo(media, media.currentTime + rate);
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 */
export function backward(media, rate) {
	return forward(media, -rate);
}

/**
 * @param {HTMLMediaElement} media
 */
export async function togglePlay(media) {
	return media.paused ? media.play() : media.pause();
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 * @param {number} min
 * @param {number} max
 */
export function increaseSpeed(media, rate, min=0, max=5) {
	return media.playbackRate = threshold(
		media.playbackRate + rate, min, max
	);
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 * @param {number} min
 * @param {number} max
 */
export function decreaseSpeed(media, rate, min=0, max=5) {
	return increaseSpeed(media, -rate, min, max);
}

/**
 * @param {HTMLMediaElement} media
 */
export function resetSpeed(media) {
	return media.playbackRate = 1;
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 */
export function increaseVolume(media, rate) {
	return media.volume = threshold(media.volume + rate, 0, 1);
}

/**
 * @param {HTMLMediaElement} media
 * @param {number} rate
 */
export function decreaseVolume(media, rate) {
	return increaseVolume(media, -rate);
}

/**
 * @param {HTMLMediaElement} media
 */
export function toggleMute(media) {
	return media.muted = !media.muted;
}
