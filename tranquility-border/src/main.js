import { optionsTable } from "./tables.js";
import { $ } from "./utils.js";

(async () => {
	try {
		const {
			lightColor,
			lightShortcut,
			darkColor,
			darkShortcut,
			boxShadow,
		} = await optionsTable.getAll();
		document.addEventListener("keydown", (e) => {
			if ([lightShortcut, darkShortcut].includes(e.key)) {
				const tranquility = $("#tranquility_container");
				if (tranquility) {
					e.preventDefault();
					document.body.style.backgroundColor = (
						lightShortcut === e.key ? lightColor : darkColor
					);
					tranquility.style.boxShadow = boxShadow;
					removeElements([
						"#tranquility_quick_tools_div",
						"#tranquility_expand_menu_btn",
						"#tranquility_page_up_div",
						"#tranquility_page_down_div",
					]);
				}
			}
		});
	} catch (error) {
		console.error(error);
	}
})()
	.catch(console.error);


function removeElements(selectors) {
	for (const selector of selectors) {
		const element = $(selector);
		if (element) {
			element.remove();
		}
	}
}
