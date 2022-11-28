import { optionsTable } from "./tables.js";
import { $, byId, sleep } from "./utils.js";

(async () => {
	const { shortcut, email, password } = await optionsTable.getAll();
	document.addEventListener("keydown", async (e) => {
		try {
			if (e.ctrlKey && e.key.toUpperCase() === shortcut) {
				e.preventDefault();
				await login(email, password);
			}
		} catch (error) {
			console.error(error);
		}
	});
})()
	.catch(console.error);

async function login(email, password) {
	byId("login").value = email;
	byId("password").value = password;
	await sleep(1000);
	$('form[action="/login/"]').submit();
}
