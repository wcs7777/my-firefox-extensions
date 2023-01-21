const configs = createConfigs(
	[
		"forvo",
		"gmail",
		"microsoft",
		"github",
		"siga",
		"linkedin",
		"quora",
	],
	"src/locations",
	"src/locations/bundle",
);

function createConfigs(files, source="src", dest="src/bundle") {
	return files.map((file) => {
		return {
			input: `${source}/${file}.js`,
			output: {
				file: `${dest}/${file}.js`,
				format: "iife",
			},
		};
	});
}

export default configs;

// https://rollupjs.org/guide/en/#configuration-files
// npx rollup --config --bundleConfigAsCjs rollup.config.js