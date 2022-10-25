import { $, tag } from "./utils.js";
import { cookiesGroupedByUrlItemTag } from "./cookies.js";

(async () => {
	try {
		const { url, cookies } = await browser.runtime.sendMessage({
			"currentPageCookies": true,
		});
		$("#container").appendChild(
			cookiesGroupedByUrlItemTag({ url, cookies }),
		);
	} catch (error) {
		document.body.appendChild(tag("p", { children: "There's an error!" }));
		console.error(error);
	}
})()
	.catch(console.error);
