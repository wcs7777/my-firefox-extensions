export function threshold(value, min, max) {
	return Math.max(Math.min(value, max), min);
}

export function isDigit(value) {
	return value.toString().length === 1 && "0123456789".includes(value);
}

export function letters() {
	return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
}

export function digits() {
	return "0123456789";
}

export function alphanumeric() {
	return letters() + digits();
}

export function isLetter(character) {
	return letters().indexOf(character) > -1;
}

export function isNumber(character) {
	return digits().indexOf(character) > -1;
}

export function isAlphanumeric(character) {
	return isLetter(character) || isNumber(character);
}

export function isString(value) {
  return Object.prototype.toString.call(value) === "[object String]"
}

export function replaceSubstringAt(str, replacement, index) {
	return (
		str.substring(0, index) +
		replacement +
		str.substring(index + replacement.length) +
		""
	);
}

export function formattedTimeToSeconds(time) {
	const hours = parseInt(time.slice(0, 2));
	const minutes = parseInt(time.slice(3, 5));
	const seconds = parseInt(time.slice(6, 8));
	return hours * 3600 + minutes * 60 + seconds;
}

export function formatSeconds(seconds, separator=":") {
	return [
		parseInt(seconds / 3600),
		parseInt(seconds % 3600 / 60),
		seconds % 60,
	]
		.map((value) => parseInt(value))
		.map((value) => padZero(value))
		.join(separator);
}

export function padZero(value) {
	return value.toString().padStart(2, "0");
}
