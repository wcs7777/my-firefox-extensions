const configs = createConfigs([
	"forvo",
	"gmail",
	"microsoft",
	"github",
	"siga",
	"linkedin",
]);

function createConfigs(files) {
	return files.map((file) => {
		return {
			input: `src/${file}.js`,
			output: {
				file: `src/bundle/${file}.js`,
				format: "iife",
			},
		};
	});
}

export default configs;

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js