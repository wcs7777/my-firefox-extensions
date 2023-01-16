export default [
	{
		input: "src/main.js",
		output: {
			file: "src/bundle/main.js",
			format: "iife",
		},
	},
	{
		input: "src/background.js",
		output: {
			file: "src/bundle/background.js",
			format: "iife",
		},
	},
];

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js