import { $$ } from "../utils/domElements.js";

export default function getMedias() {
	return $$("video, audio");
}
