import { $, tag } from "../utils.js";
import { itemFragment } from "../cookies.js";

(async () => {
	try {
		const url = await browser.runtime.sendMessage({
			"currentPageCookiesRemoved": true,
		});
		$("#container").appendChild(itemFragment("Cookies removed on: ", url));
	} catch (error) {
		document.body.appendChild(tag("p", { children: "There's an error!" }));
		console.error(error);
	}
})()
	.catch(console.error);
