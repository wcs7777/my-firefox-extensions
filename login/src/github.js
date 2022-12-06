import { optionsTable } from "./tables.js";
import { waitFormToSubmit, waitInputToSetValue } from "./utils.js";
import listenLogin from "./listen-login.js";

(async () => {
	const credentials = await optionsTable.get("github");
	listenLogin(
		credentials.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		await waitInputToSetValue("#login_field", user);
		await waitInputToSetValue("#password", password);
		await waitFormToSubmit("form[action='/session']");
	};
}
