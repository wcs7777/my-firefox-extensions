import { optionsTable } from "./tables.js";
import { byId, waitInputToSetValue } from "./utils.js";
import listenLogin from "./listen-login.js";

(async () => {
	const credentials = await optionsTable.get("microsoft");
	listenLogin(
		credentials.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		if (byId("displayName") == null) {
			await waitInputToSetValue("#i0116", user);
			byId("idSIButton9").click();
		} else {
			await waitInputToSetValue("#i0118", password);
			byId("idSIButton9").click();
		}
	};
}
