export default [
	{
		input: "src/app.js",
		output: {
			file: "src/bundle/app.js",
			format: "iife",
		},
	},
];

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js