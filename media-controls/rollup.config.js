export default [
	{
		input: "src/main.js",
		output: {
			file: "src/bundle/main.js",
			format: "iife",
		},
	},
];

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config rollup.config.js
