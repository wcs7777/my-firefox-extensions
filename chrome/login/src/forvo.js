import { optionsTable } from "./tables.js";
import { waitFormToSubmit, waitInputToSetValue } from "./utils.js";
import listenLogin from "./listen-login.js";

(async () => {
	const logins = await optionsTable.get("forvo");
	listenLogin(
		logins.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		await waitInputToSetValue("#login", user);
		await waitInputToSetValue("#password", password);
		await waitFormToSubmit("form[action='/login/']");
	};
}
