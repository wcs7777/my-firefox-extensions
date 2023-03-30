import download from "./download.js"

export default function downloadObject(obj, filename) {
	const url = URL.createObjectURL(object2blob(obj));
	return download(url, filename).finally(() => URL.revokeObjectURL(url));
}

function object2blob(obj) {
	return new Blob(
		[JSON.stringify(obj, null, 2)],
		{ type: "application/json" },
	);
}

