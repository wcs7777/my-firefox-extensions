export function object2blob(obj) {
	return new Blob(
		[JSON.stringify(obj, null, 2)],
		{ type: "application/json" },
	);
}

export function file2object(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", onLoad);
		reader.addEventListener("error", onError);
		reader.readAsText(file);

		function onLoad(e) {
			removeListeners();
			try {
				return resolve(JSON.parse(e.target.result));
			} catch (error) {
				return reject(error);
			}
		}

		function onError(error) {
			removeListeners();
			return reject(error);
		}

		function removeListeners() {
			reader.removeEventListener("load", onLoad);
			reader.removeEventListener("error", onError);
		}
	});
}

export function download(url, filename) {
	return new Promise(async (resolve, reject) => {
		try {
			const id = await browser.downloads.download({ url, filename });
			browser.downloads.onChanged.addListener(listener);

			function listener(delta) {
				if (delta.id === id) {
					if (delta?.state?.current === "complete") {
						browser.downloads.onChanged.removeListener(listener);
						resolve(`${filename} download completed`);
					} else if (delta?.error?.current) {
						browser.downloads.onChanged.removeListener(listener);
						reject(new Error(delta.error.current));
					}
				}
			}
		} catch (error) {
			return reject(error);
		}
	});
}

export function downloadObject(obj, filename) {
	const url = URL.createObjectURL(object2blob(obj));
	return download(url, filename).finally(() => URL.revokeObjectURL(url));
}

export function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export function toArray(value) {
	return Array.isArray(value) ? value : [value];
}

export function toObject(value) {
	return typeof value === "object" ? value : { [value]: value };
}
