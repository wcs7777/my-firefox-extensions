export default [
	{
		input: "src/mozilla.js",
		output: {
			file: "src/bundle/mozilla.js",
			format: "iife",
		},
	},
	{
		input: "src/express.js",
		output: {
			file: "src/bundle/express.js",
			format: "iife",
		},
	},
	{
		input: "src/google.js",
		output: {
			file: "src/bundle/google.js",
			format: "iife",
		},
	},
];

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config rollup.config.js
