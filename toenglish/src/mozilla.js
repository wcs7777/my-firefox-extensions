import { commonLogic } from "./common-logic";

commonLogic(() => {
	if (window.location.href.includes("pt-BR")) {
		window.open(
			window.location.href.replace("pt-BR", "en-US"),
			"_self",
		);
	}
})
	.catch(console.error);
