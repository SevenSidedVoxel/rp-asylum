import { ViewCtx } from "./views";
import { HomeView } from "./views/home";

export const BuildTimestamp = __BUILD_TIMESTAMP__;
export const BuildID = "chipmunk";

document.addEventListener("DOMContentLoaded", () => {
	// Display version number
	const footer = document.getElementById("version");
	footer!.innerHTML = `${BuildID} - ${BuildTimestamp}`;

	// Setup root & view
	const root = document.getElementById("content-root");
	var rootCtx = new ViewCtx(root);
	rootCtx.changeView(new HomeView());
});