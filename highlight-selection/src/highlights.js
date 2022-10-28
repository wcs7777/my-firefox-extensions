import { $, fragment, tag } from "./utils.js";

(async () => {
	const { title, highlights } = await browser.runtime.sendMessage({
		getData: true,
	});
	document.title = `Highlight - ${title}`;
	$("#highlights").appendChild(
		fragment(highlights.map((h) => tag("li", { children: h }))),
	);
})()
	.catch(console.error);
