import { optionsTable } from "./tables.js";
import { byId, sleep, waitInputToSetValue } from "./utils.js";
import listenLogin from "./listen-login.js";

(async () => {
	const credentials = await optionsTable.get("gmail");
	listenLogin(
		credentials.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		const ms = 1500;
		await waitInputToSetValue("#identifierId", user);
		await sleep(ms);
		byId("identifierNext").click();
		await sleep(ms);
		await waitInputToSetValue("input[type='password']", password);
		await sleep(ms);
		byId("passwordNext").click();
	};
}
