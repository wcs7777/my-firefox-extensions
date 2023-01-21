import { optionsTable } from "../storage/tables.js";
import { byId, sleep, waitInputToSetValue } from "../utils/utils.js";
import listenLogin from "../utils/listen-login.js";

(async () => {
	const logins = await optionsTable.get("gmail");
	listenLogin(
		logins.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		const ms = 2000;
		await waitInputToSetValue("#identifierId", user);
		await sleep(ms);
		byId("identifierNext").click();
		await sleep(ms);
		await waitInputToSetValue("input[type='password']", password);
		await sleep(ms);
		byId("passwordNext").click();
	};
}
