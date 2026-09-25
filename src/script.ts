import { ViewCtx } from "./views";
import { HomeView } from "./views/home";

document.addEventListener("DOMContentLoaded", () => {
	const root = document.getElementById("content-root");
	var rootCtx = new ViewCtx(root);
	rootCtx.changeView(new HomeView());
});