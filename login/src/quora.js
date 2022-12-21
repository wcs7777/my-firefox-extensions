import { optionsTable } from "./tables.js";
import { waitInputToSetValue } from "./utils.js";
import listenLogin from "./listen-login.js";

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
