import { isDigit, replaceSubstringAt, threshold } from "./utils";

export function onlyTimeOnKeydown(separator, e) {
	if (e === undefined) {
		e = separator;
		separator = ":";
	}
	if (
		!e.key.startsWith("Arrow") &&
		!["Home", "End"].includes(e.key) &&
		!e.ctrlKey &&
		true
	) {
		e.preventDefault();
	} else if (e.ctrlKey) {
		return;
	}
	const index = getInputCursorIndex(e.target);
	if (isDigit(e.key)) {
		setInputTimeDigitAt(e.target, e.key, index, separator);
	} else if (e.key === e.target.value[index]) {
		setInputCursorIndex(e.target, index + 1);
	} else if (e.key === "Tab") {
		setInputCursorIndex(
			e.target,
			index < 3 ? 3 :
			index < 6 ? 6 : 0
		);
	} else if (e.key === "Backspace" && index > 0) {
		const previous = index - 1;
		resetInputTimeValueAt(e.target, previous, separator);
		setInputCursorIndex(e.target, previous);
	} else if (e.key === "Delete" && index < e.target.value.length) {
		resetInputTimeValueAt(e.target, index, separator);
		setInputCursorIndex(e.target, index);
	}
}

export function onlyTimeOnPaste(separator, e) {
	if (e === undefined) {
		e = separator;
		separator = ":";
	}
	e.preventDefault();
	const digits = e.clipboardData
		.getData("text")
		.replace(/[^\d]/g, "")
		.split("");
	const lastDigitIndex = e.target.value.length;
	for (const digit of digits) {
		const index = getInputCursorIndex(e.target);
		if (getInputCursorIndex(e.target) === lastDigitIndex) {
			break;
		}
		setInputTimeDigitAt(e.target, digit, index, separator,);
	}
}

export function onCut(e) {
	e.preventDefault();
}

function setInputTimeDigitAt(input, digit, index, separator) {
	const skipped = skipSeparator(input.value, index, separator);
	replaceInputValueAt(input, digit, skipped);
	setInputCursorIndex(input, skipped + 1);
}

function resetInputTimeValueAt(input, index, separator) {
	if (input.value[index] !== separator) {
		replaceInputValueAt(input, "0", index);
	}
}

function skipSeparator(value, index, separator) {
	return (
		value[index] !== separator ?
		threshold(index, 0, value.length - 1) :
		index + 1
	);
}

function getInputCursorIndex(input) {
	return (
		input.selectionDirection !== "backward" ?
		input.selectionStart :
		input.selectionEnd
	);
}

function setInputCursorIndex(input, index) {
	input.setSelectionRange(index, index);
}

function replaceInputValueAt(input, replacement, index) {
	input.value = replaceSubstringAt(input.value, replacement, index);
}
