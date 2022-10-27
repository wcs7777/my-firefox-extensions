export default [
	{
		input: "src/content.js",
		output: {
			file: "src/bundle/content.js",
			format: "iife",
		},
	},
];

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js
