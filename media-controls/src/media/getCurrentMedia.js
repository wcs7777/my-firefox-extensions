import getMedias from "./getMedias.js";

export default function getCurrentMedia(medias=getMedias()) {
	return medias.find((media) => !media.isPaused) || medias?.[0];
}
