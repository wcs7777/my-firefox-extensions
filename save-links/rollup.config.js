const configs = [
	{
		input: "src/content/change-link-color.js",
		output: {
			file: "src/content/change-link-color-bundle.js",
			format: "iife",
		},
	},
];

export default configs;

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js
