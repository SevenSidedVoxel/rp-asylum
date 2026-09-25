import { AppCtx } from "./AppCtx";
import { GameView } from "./views/GameView";
import { MainMenuView } from "./views/MainMenuView";

export const BuildTimestamp = __BUILD_TIMESTAMP__;
export const BuildID = "barycentric";

document.addEventListener("DOMContentLoaded", () => {
	// Display version number
	const footer = document.getElementById("version");
	footer!.innerHTML = `${BuildID} - ${BuildTimestamp}`;

	// Setup root & view
	const root = document.getElementById("content-root");
	var ctx = new AppCtx(root);
	// ctx.changeView(new MainMenuView(ctx));
	ctx.changeView(new GameView(ctx));
});