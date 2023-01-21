import { optionsTable } from "../storage/tables.js";
import { $, sleep, waitInputToSetValue } from "../utils/utils.js";
import listenLogin from "../utils/listen-login.js";

(async () => {
	const logins = await optionsTable.get("linkedin");
	listenLogin(
		logins.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		await waitInputToSetValue("#session_key", user);
		await waitInputToSetValue("#session_password", password);
		await sleep(500);
		$("form.sign-in-form").submit();
	};
}
