import { commonLogic } from "./common-logic";

commonLogic(() => {
	if (window.location.href.includes("pt-br")) {
		window.open(
			window.location.href.replace("pt-br", "en"),
			"_self",
		);
	}
})
	.catch(console.error);
