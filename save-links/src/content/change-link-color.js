import { $$ } from "../utils/utils.js";

for (const anchor of $$("a")) {
	if (anchor.href === link) {
		anchor.style.color = color;
	}
}

