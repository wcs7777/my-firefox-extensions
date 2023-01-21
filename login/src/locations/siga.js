import { optionsTable } from "../storage/tables.js";
import { $, sleep, waitInputToSetValue } from "../utils/utils.js";
import listenLogin from "../utils/listen-login.js";

(async () => {
	const logins = await optionsTable.get("siga");
	listenLogin(
		logins.map(({ user, password }) => createLogin(user, password)),
	);
})()
	.catch(console.error);

function createLogin(user, password) {
	return async () => {
		await waitInputToSetValue("#vSIS_USUARIOID", user);
		await waitInputToSetValue("#vSIS_USUARIOSENHA", password);
		await sleep(500);
		$("input[type='button']").click();
	};
}
