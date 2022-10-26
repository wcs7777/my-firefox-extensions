import { $, fragment, tag } from "../utils.js";
import { cookiesGroupedByUrlItemTag } from "../cookies.js";

(async () => {
	try {
		const cookiesGroupedByUrl = await browser.runtime.sendMessage({
			"getCookiesGroupedByUrl": true,
		});
		$("#cookiesGroupedByUrl").appendChild(
			fragment(
				cookiesGroupedByUrl.map((item) => {
					return tag("li", { children: cookiesGroupedByUrlItemTag(item) });
				}),
			),
		);
	} catch (error) {
		document.body.appendChild(tag("p", { children: "There's an error!" }));
		console.error(error);
	}
})()
	.catch(console.error);
