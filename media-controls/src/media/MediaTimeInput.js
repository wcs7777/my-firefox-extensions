import {
	formatSeconds,
	formattedTimeToSeconds,
	isDigit,
	replaceSubstringAt,
	threshold
} from "../utils/alphanumeric.js";
import { tag } from "../utils/domElements.js";
import { createOnKeydown } from "../utils/domEvents.js";
import EventsManager from "../utils/EventsManager.js";

export default class MediaTimeInput {

	constructor({
		cssText,
		media,
		separator=":",
		shortcuts={ synchronizeValue: "s" },
	}={}) {
		this.input = tag({ tagName: "input", cssText });
		this.media = media;
		this.separator = separator;
		this.shortcuts = shortcuts;
		this.time = 0;
		this.cursorPosition = 0;
		this.length = this.value.length;
		this.keydownManager = this.createKeydownManager();
		this.cutManager = new EventsManager({
			target: this.input,
			type: "cut",
			listeners: (e) => e.preventDefault(),
		});
		this.pasteManager = new EventsManager({
			target: this.input,
			type: "paste",
			listeners: this.pasteListener.bind(this),
		});
	}

	addEventListener(type, listener) {
		this.input.addEventListener(type, listener);
	}

	focus() {
		this.input.focus();
	}

	prepareAppend(media) {
		if (media) {
			this.media = media;
		}
		this.time = 0;
		this.cursorPosition = 0;
		this.length = this.value.length;
		this.keydownManager.on();
		this.cutManager.on();
		this.pasteManager.on();
		return this.input;
	}

	remove() {
		this.keydownManager.off();
		this.cutManager.off();
		this.pasteManager.off();
		this.input.remove();
		this.input.dispatchEvent(new CustomEvent("removed"));
	}

	get isConnected() {
		return this.input.isConnected;
	}

	get value() {
		return this.input.value;
	}

	set value(newValue) {
		return this.input.value = newValue;
	}

	/**
	 * @param {number|string} seconds
	 */
	set time(seconds) {
		this.value = formatSeconds(parseInt(seconds), this.separator);
	}

	/**
	 * @param {string} value
	 */
	set digits(value) {
		for (const digit of value) {
			const position = this.cursorPosition;
			if (position >= this.length) {
				break;
			}
			this.setDigitAt(digit, position);
		}
	}

	get cursorPosition() {
		return (
			this.input.selectionDirection !== "backward" ?
			this.input.selectionStart :
			this.input.selectionEnd
		);
	}

	set cursorPosition(position) {
		const offset = threshold(position, 0, this.length - 1);
		this.input.setSelectionRange(offset, offset);
	}

	isSeparator(position) {
		return this.value[position] === this.separator;
	}

	setDigitAt(digit, position, updateCursorPosition=true) {
		if (isDigit(digit)) {
			const pos = threshold(
				!this.isSeparator(position) ? position : position + 1,
				0,
				this.length - 1,
			);
			this.value = replaceSubstringAt(this.value, digit, pos);
			if (updateCursorPosition) {
				this.cursorPosition = pos + 1;
			}
		}
	}

	resetDigitAt(position) {
		this.setDigitAt("0", position, false);
		this.cursorPosition = position;
	}

	guardListener(event) {
		if (
			!event.key.startsWith("Arrow") &&
			!["Home", "End"].includes(event.key) &&
			!event.ctrlKey &&
			true
		) {
			event.preventDefault();
		}
	}

	digitListener(event) {
		this.setDigitAt(event.key, this.cursorPosition, true);
	}

	separatorListener() {
		this.cursorPosition = this.cursorPosition + 1;
	}

	backspaceListener() {
		const position = this.cursorPosition;
		if (position > 0) {
			this.resetDigitAt(position - 1);
		}
	}

	deleteListener() {
		const position = this.cursorPosition;
		if (position < this.length) {
			this.resetDigitAt(position);
		}
	}

	goToNextUnitListener() {
		const position = this.cursorPosition;
		this.cursorPosition = (
			position < 3 ? 3 :
			position < 6 ? 6 : 0
		);
	}

	goToPreviousUnitListener() {
		const position = this.cursorPosition;
		this.cursorPosition = (
			position < 3 ? 6 :
			position < 6 ? 0 : 3
		);
	}

	moveCursorForward() {
		this.cursorPosition = this.cursorPosition + 1;
	}

	moveCursorBackward() {
		this.cursorPosition = this.cursorPosition - 1;
	}

	synchronizeValueWithMedia() {
		this.time = this.media.currentTime;
		this.cursorPosition = this.value.search(`[^0|^${this.separator}]`);
	}

	synchronizeMediaWithValue() {
		this.media.currentTime = threshold(
			formattedTimeToSeconds(this.value),
			0,
			this.media.duration,
		);
	}

	removeListener() {
		this.remove();
	}

	pasteListener(event) {
		event.preventDefault();
		this.digits = event.clipboardData.getData("text").replace(/[^\d]/g, "");
	}

	createKeydownManager() {
		const thisArg = this;
		return new EventsManager({
			target: this.input,
			type: "keydown",
			on: true,
			listeners: [
				this.guardListener,
				...[
					{
						keys: this.shortcuts.synchronizeValue,
						caseSensitive: false,
						ctrlKey: true,
						preventDefault: true,
						listener: this.synchronizeValueWithMedia,
					},
					{
						keys: "0123456789".split(""),
						listener: this.digitListener,
					},
					{
						keys: this.separator,
						listener: this.separatorListener,
					},
					{
						keys: "Backspace",
						listener: this.backspaceListener,
					},
					{
						keys: "Delete",
						listener: this.deleteListener,
					},
					{
						keys: "Tab",
						listener: this.goToNextUnitListener,
					},
					{
						keys: "Tab",
						shiftKey: true,
						listener: this.goToPreviousUnitListener,
					},
					{
						keys: [" ", "l"],
						listener: this.moveCursorForward,
					},
					{
						keys: "h",
						listener: this.moveCursorBackward,
					},
					{
						keys: " ",
						shiftKey: true,
						listener: this.moveCursorBackward,
					},
					{
						keys: "Enter",
						listener: this.synchronizeMediaWithValue,
					},
					{
						keys: ["Enter", "Escape"],
						listener: this.removeListener,
					},
				]
					.map(({ listener, ...rest }) => {
						return createOnKeydown({
							listener: listener.bind(thisArg),
							preventDefault: false,
							...rest,
						});
					}),
			],
		});
	}

}
