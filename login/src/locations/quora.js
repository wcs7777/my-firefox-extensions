import { optionsTable } from "../storage/tables.js";
import { waitInputToSetValue } from "../utils/utils.js";
import listenLogin from "../utils/listen-login.js";

(async () => {
	const logins = await optionsTable.get("quora");
	listenLogin(
		logins.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		await waitInputToSetValue("#email", user);
		await waitInputToSetValue("#password", password);
	};
}
