/**
 * @type {{
 *     addShortcut: HTMLInputElement,
 *     addEngine: HTMLInputElement,
 *     actionAddShortcut: HTMLButtonElement,
 *     removeEngine: HTMLSelectElement,
 *     actionRemoveEngine: HTMLButtonElement,
 *     defaultEngine: HTMLSelectElement,
 *     actionSetDefaultEngine: HTMLButtonElement,
 *     settings: HTMLTextAreaElement,
 *     actionUpdateSettings: HTMLButtonElement,
 *     dialog: HTMLDialogElement,
 *     dialogMessage: HTMLParagraphElement,
 * }}
 */
const el = {
	addShortcut: byId('addShortcut'),
	addEngine: byId('addEngine'),
	actionAddShortcut: byId('actionAddShortcut'),
	removeEngine: byId('removeEngine'),
	actionRemoveEngine: byId('actionRemoveEngine'),
	defaultEngine: byId('defaultEngine'),
	actionSetDefaultEngine: byId('actionSetDefaultEngine'),
	settings: byId('settings'),
	actionUpdateSettings: byId('actionUpdateSettings'),
	dialog: byId('dialog'),
	dialogMessage: byId('dialogMessage'),
};

document.addEventListener('DOMContentLoaded', setFieldsValues);

el.actionAddShortcut.addEventListener('click', async () => {
	const feedback = msg => showFeedback(
		msg,
		{ aboveElement: el.actionAddShortcut },
	);
	try {
		const shortcut = el.addShortcut.value.trim().toLocaleLowerCase();
		const engine = el.addEngine.value.trim();
		if (!shortcut) {
			feedback('Shortcut value is required!');
			return;
		}
		if (!engine) {
			feedback('Engine value is required!');
			return;
		}
		const { engines } = await browser.storage.local.get({ engines: {} });
		engines[shortcut] = engine;
		await browser.storage.local.set({ engines });
		await setFieldsValues();
		feedback('Engine added');
	} catch (error) {
		console.error(error);
		feedback(error);
	}
});

el.actionRemoveEngine.addEventListener('click', async () => {
	const feedback = msg => showFeedback(
		msg,
		{ aboveElement: el.actionRemoveEngine },
	);
	try {
		const engine = el.removeEngine.value.trim();
		if (!engine) {
			feedback('Engine value is required!');
			return;
		}
		const { engines } = await browser.storage.local.get({ engines: {} });
		delete engines[engine];
		await browser.storage.local.set({ engines });
		await setFieldsValues();
		feedback('Engine removed');
	} catch (error) {
		console.error(error);
		feedback(error);
	}
});

el.actionSetDefaultEngine.addEventListener('click', async () => {
	const feedback = msg => showFeedback(
		msg,
		{ aboveElement: el.actionSetDefaultEngine },
	);
	try {
		const defaultEngine = el.defaultEngine.value.trim().toLocaleLowerCase();
		if (!defaultEngine) {
			feedback('Default engine value is required!');
			return;
		}
		await browser.storage.local.set({ defaultEngine });
		await setFieldsValues();
		feedback('Default engine set');
	} catch (error) {
		console.error(error);
		feedback(error);
	}
});

el.actionUpdateSettings.addEventListener('click', async () => {
	const feedback = msg => showFeedback(
		msg,
		{ aboveElement: el.actionUpdateSettings },
	);
	try {
		const settings = el.settings.value.trim();
		if (!settings) {
			feedback('Settings value is required!');
			return;
		}
		const { engines, defaultEngine } = JSON.parse(settings);
		if (engines) {
			await browser.storage.local.set({ engines });
		}
		if (defaultEngine) {
			await browser.storage.local.set({ defaultEngine });
		}
		await setFieldsValues();
		feedback('Settings updated');
	} catch (error) {
		console.error(error);
		feedback(error);
	}
});

/**
 * @returns {Promise<void>}
 */
async function setFieldsValues() {
	try {
		const options = await browser.storage.local.get();
		el.addEngine.value = '';
		el.addShortcut.value = '';
		const engines = options?.engines ?? {};
		el.removeEngine.replaceChildren(
			...Object.entries(engines).map(([shortcut, url]) => {
				const option = document.createElement('option');
				option.value = shortcut;
				option.textContent = `${shortcut} - ${url.slice(0, 10)}`;
				return option;
			}),
		);
		el.defaultEngine.replaceChildren(
			...Object.entries(engines).map(([shortcut, url]) => {
				const option = document.createElement('option');
				option.value = shortcut;
				option.textContent = `${shortcut} - ${url.slice(0, 80)}`;
				return option;
			}),
		);
		el.removeEngine.value = '';
		const firstEngine = Object.keys(engines)?.[0];
		let defaultEngine = null;
		if (firstEngine) {
			defaultEngine = options?.defaultEngine;
			if (!(defaultEngine in engines)) {
				defaultEngine = firstEngine;
			}
		}
		el.defaultEngine.value = defaultEngine;
		options.engines = engines;
		options.defaultEngine = defaultEngine;
		await browser.storage.local.set(options);
		el.settings.value = JSON.stringify(options, null, 2);
	} catch (error) {
		console.error(error);
		showFeedback(error);
	}
}

/**
 * @param {string} id
 * @returns {HTMLElement | null}
 */
function byId(id) {
	const el = document.getElementById(id);
	if (el === null) {
		throw Error(`${id} not found`);
	}
	return el;
}

let dialogTimeoutId = 0;
/**
 * @param {string} message
 * @param {{ timeout: number, top: string, aboveElement: HTMLElement }}
 * @returns {void}
 */
function showFeedback(
	message,
	{ timeout=1500, top='5%', aboveElement=null }={},
) {
	if (dialogTimeoutId) {
		clearTimeout(dialogTimeoutId);
	}
	if (aboveElement) {
		const rect = aboveElement.getBoundingClientRect();
		top = `${Math.max(rect.top - 120, 0)}px`;
	}
	el.dialog.style.top = top;
	el.dialog.open = true;
	el.dialogMessage.textContent = message;
	dialogTimeoutId = setTimeout(() => {
		el.dialog.open = false;
		dialogTimeoutId = 0;
	}, timeout);
}
