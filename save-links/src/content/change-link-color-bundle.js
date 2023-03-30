(function () {
	'use strict';

	function $$(selectors, target=document) {
		return Array.from(target.querySelectorAll(selectors));
	}

	for (const anchor of $$("a")) {
		if (anchor.href === link) {
			anchor.style.color = color;
		}
	}

})();
