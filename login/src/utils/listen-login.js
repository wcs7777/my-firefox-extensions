import { isNumber } from "./utils.js";

export default function listenLogin(logins) {
	document.addEventListener("keydown", async (e) => {
		try {
			if (e.altKey && isNumber(e.key)) {
				e.preventDefault();
				const index = Math.max(
					0,
					Math.min(
						parseInt(e.key) - 1,
						logins.length - 1,
					),
				);
				await logins[index]();
			}
		} catch (error) {
			console.error(error);
		}
	});
}
