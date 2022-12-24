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
	}
	if (!e.ctrlKey) {
		const index = getInputCursorIndex(e.target);
		if (isDigit(e.key)) {
			setInputDigitAt(e.target, e.key, index, separator);
		} else if (e.key === e.target.value[index]) {
			setInputCursorIndex(e.target, index + 1);
		} else if (e.key === "Tab") {
			setInputCursorIndex(
				e.target,
				index < 3 ? 3 :
				index < 6 ? 6 : 0
			);
		}
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
		setInputDigitAt(e.target, digit, index, separator,);
	}
}

export function onCut(e) {
	e.preventDefault();
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

function setInputDigitAt(input, digit, index, separator) {
	const skipped = skipSeparator(input.value, index, separator);
	replaceInputValueAt(input, skipped, digit);
	setInputCursorIndex(input, skipped + 1);
}

function replaceInputValueAt(input, index, replacement) {
	input.value = replaceSubstringAt(input.value, index, replacement);
}
