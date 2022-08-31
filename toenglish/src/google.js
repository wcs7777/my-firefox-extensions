import { commonLogic } from "./common-logic";

commonLogic(() => {
	if (!window.location.href.includes("&lr=lang_en")) {
		window.open(
			window.location.href + "&lr=lang_en",
			"_self",
		);
	}
})
	.catch(console.error);
