import {
	formatSeconds,
	formattedTimeToSeconds,
	isDigit,
	replaceSubstringAt,
	threshold,
} from "./alphanumeric.js";
import { tag } from "./domElements.js";
import { createOnKeydown, manageEvents } from "./domEvents.js";

export default class MediaTimeInput {

	constructor({
		cssText,
		media,
		separator=":",
		shortcuts={ synchronizeValue: "s" },
	}={}) {
		this._input = tag({ tagName: "input", cssText });
		this._media = media;
		this._separator = separator;
		this._shortcuts = shortcuts;
		this.time = 0;
		this.cursorPosition = 0;
		this._length = this.value.length;
		this._keydownManager = {};
		this._cutManager = {};
		this._pasteManager = {};
		this.listenKeydown();
		this.listenCut();
		this.listenPaste();
	}

	addEventListener(type, listener) {
		this._input.addEventListener(type, listener);
	}

	focus() {
		this._input.focus();
	}

	prepareAppend(media) {
		if (media) {
			this._media = media;
		}
		this.time = 0;
		this.cursorPosition = 0;
		this._length = this.value.length;
		return this._input;
	}

	remove() {
		this._input.remove();
		this._input.dispatchEvent(new CustomEvent("removed"));
	}

	get isConnected() {
		return this._input.isConnected;
	}

	get value() {
		return this._input.value;
	}

	set value(newValue) {
		return this._input.value = newValue;
	}

	set time(seconds) {
		this.value = formatSeconds(parseInt(seconds), this._separator);
	}

	set digits(value) {
		for (const digit of value) {
			const position = this.cursorPosition;
			if (position >= this._length) {
				break;
			}
			this.setDigitAt(digit, position);
		}
	}

	get cursorPosition() {
		return (
			this._input.selectionDirection !== "backward" ?
			this._input.selectionStart :
			this._input.selectionEnd
		);
	}

	set cursorPosition(position) {
		const offset = threshold(position, 0, this._length - 1);
		this._input.setSelectionRange(offset, offset);
	}

	isSeparator(position) {
		return this.value[position] === this._separator;
	}

	setDigitAt(digit, position, updateCursorPosition=true) {
		if (isDigit(digit)) {
			const pos = threshold(
				!this.isSeparator(position) ? position : position + 1,
				0,
				this._length - 1,
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

	listenKeydown() {
		const self = this;
		this._keydownManager.off?.();
		this._keydownManager = manageEvents({
			target: this._input,
			type: "keydown",
			on: true,
			listeners: [
				this.guardListener,
				...[
					{
						keys: this._shortcuts.synchronizeValue,
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
						keys: this._separator,
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
							listener: listener.bind(self),
							preventDefault: false,
							...rest,
						});
					}),
			],
		});
	}

	listenCut() {
		this._cutManager.off?.();
		this._cutManager = manageEvents({
			target: this._input,
			type: "cut",
			on: true,
			listeners: (e) => e.preventDefault(),
		});
	}

	listenPaste() {
		this._pasteManager.off?.();
		this._pasteManager = manageEvents({
			target: this._input,
			type: "paste",
			on: true,
			listeners: this.pasteListener.bind(this),
		});
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
		if (position < this._length) {
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
		this.time = this._media.currentTime;
		this.cursorPosition = this.value.search(`[^0|^${this._separator}]`);
	}

	synchronizeMediaWithValue() {
		this._media.currentTime = threshold(
			formattedTimeToSeconds(this.value),
			0,
			this._media.duration,
		);
	}

	removeListener() {
		this.remove();
	}

	pasteListener(event) {
		event.preventDefault();
		this.digits = event.clipboardData.getData("text").replace(/[^\d]/g, "");
	}

}
