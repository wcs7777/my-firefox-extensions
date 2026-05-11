export default class Addon {
	/** @type {Object<string, string>} */
	#engines = {};
	/** @type {string} */
	#defaultEngine = '';
	/** @type {string} */
	#currentLastSearch = '';

	/**
	 * @param {string} input
	 * @returns {Promise<{ suggestion: string, shortcut: string }>}
	 */
	async buildSuggestion(input) {
		const parts = input.trim().split(/\s+/);
		if (parts.length === 0) {
			return '';
		}
		let shortcut = parts[0].toLocaleLowerCase();
		const hasShortcut = shortcut in this.#engines;
		const words = hasShortcut ? parts.slice(1) : parts;
		let search = encodeURIComponent(words.join(' '));
		if (hasShortcut) {
			if (!search) {
				search = await this.lastSearch();
			}
		} else {
			shortcut = this.#defaultEngine;
		}
		if (search) {
			this.#currentLastSearch = search;
		}
		const suggestion = this.#engines[shortcut].replace('%s', search);
		return { suggestion, shortcut };
	}

	/**
	 * @returns {Promise<string>}
	 */
	async lastSearch() {
		const { lastSearch } = await browser.storage.session.get({
			lastSearch: '',
		});
		return lastSearch;
	}

	/**
	 * @param {string} lastSearch
	 * @returns {Promise<void>}
	 */
	async updateLastSearch() {
		if (!this.#currentLastSearch) {
			return;
		}
		await browser.storage.session.set({
			lastSearch: this.#currentLastSearch,
		});
		this.#currentLastSearch = '';
	}

	async syncStorage() {
		const { engines, defaultEngine } = await browser.storage.local.get({
			engines: {},
			defaultEngine: null,
		});
		this.#engines =
			Object.keys(engines).length > 0
			? engines
			: { g: 'https://www.google.com/search?q=%s' };
		this.#defaultEngine = defaultEngine ?? Object.keys(this.#engines)[0];
		const description = Object
			.keys(this.#engines)
			.map(e => e !== this.#defaultEngine ? e : `(${e})`)
			.join(' ');
		browser.omnibox.setDefaultSuggestion({ description });
	}
}
